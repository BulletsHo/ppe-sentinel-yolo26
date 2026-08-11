#!/usr/bin/env python3
"""Remove local filesystem paths from a trusted Ultralytics checkpoint."""

from __future__ import annotations

import argparse
import os
import re
import sys
from collections.abc import Mapping
from pathlib import Path

from runtime_bootstrap import load_ultralytics


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL = ROOT / "outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt"
LOCAL_PATH = re.compile(r"(?i)(?:[a-z]:[\\/]users[\\/][^\\/]+|/(?:home|users)/[^/]+)")
PORTABLE_VALUES = {
    "data": "dataset.yaml",
    "model": "best.pt",
    "project": "outputs/yolo26-train",
    "save_dir": "outputs/yolo26-train/ppe-model",
    "source": "",
}


def portable_string(key: str, value: str) -> tuple[str, bool]:
    if not LOCAL_PATH.search(value):
        return value, False
    replacement = PORTABLE_VALUES.get(key)
    if replacement is None:
        replacement = Path(value.replace("\\", "/")).name or "local-file"
    return replacement, True


def sanitize_value(value, key: str = ""):
    if isinstance(value, str):
        return portable_string(key, value)
    if isinstance(value, Path):
        sanitized, changed = portable_string(key, str(value))
        return (Path(sanitized), changed)
    if isinstance(value, Mapping):
        changed = False
        sanitized = {}
        for item_key, item_value in value.items():
            clean_value, item_changed = sanitize_value(item_value, str(item_key))
            sanitized[item_key] = clean_value
            changed = changed or item_changed
        return sanitized, changed
    if isinstance(value, list):
        changed = False
        sanitized = []
        for item in value:
            clean_item, item_changed = sanitize_value(item, key)
            sanitized.append(clean_item)
            changed = changed or item_changed
        return sanitized, changed
    if isinstance(value, tuple):
        clean_items, changed = sanitize_value(list(value), key)
        return tuple(clean_items), changed
    return value, False


def sanitize_checkpoint(checkpoint: dict) -> bool:
    changed = False
    for checkpoint_key in tuple(checkpoint):
        if checkpoint_key in {"model", "ema", "optimizer", "scaler"}:
            continue
        checkpoint[checkpoint_key], item_changed = sanitize_value(checkpoint[checkpoint_key], checkpoint_key)
        changed = changed or item_changed

    for object_key in ("model", "ema"):
        model = checkpoint.get(object_key)
        if model is None:
            continue
        for attribute in ("args", "pt_path"):
            if not hasattr(model, attribute):
                continue
            clean_value, item_changed = sanitize_value(getattr(model, attribute), attribute)
            if item_changed:
                setattr(model, attribute, clean_value)
                changed = True
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--in-place", action="store_true")
    parser.add_argument("--ultralytics-site-packages", type=Path)
    args = parser.parse_args()
    source = args.model.resolve()
    if not source.is_file():
        print(f"Checkpoint not found: {source}", file=sys.stderr)
        return 2
    if args.in_place and args.output:
        parser.error("--in-place and --output are mutually exclusive")
    output = source if args.in_place else (args.output.resolve() if args.output else source.with_name(f"{source.stem}.sanitized.pt"))

    try:
        torch, _ = load_ultralytics(args.ultralytics_site_packages)
        checkpoint = torch.load(source, map_location="cpu", weights_only=False)
    except Exception as exc:
        print(f"Unable to load trusted checkpoint: {exc}", file=sys.stderr)
        return 3
    if not isinstance(checkpoint, dict):
        print("Checkpoint is not an Ultralytics dictionary", file=sys.stderr)
        return 4

    changed = sanitize_checkpoint(checkpoint)
    temporary = output.with_name(f".{output.name}.privacy-tmp")
    try:
        torch.save(checkpoint, temporary)
        serialized = temporary.read_bytes()
        if LOCAL_PATH.search(serialized.decode("latin-1")):
            print("Sanitized checkpoint still contains a local user path", file=sys.stderr)
            return 5
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Checkpoint {'sanitized' if changed else 'verified'}: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

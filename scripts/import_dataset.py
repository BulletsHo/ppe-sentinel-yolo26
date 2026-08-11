#!/usr/bin/env python3
"""Import and validate a YOLO dataset into the PPE dataset registry."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import uuid
import zipfile
from collections import Counter
from pathlib import Path

import yaml


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
MARKER = ".ppe-dataset"


def dataset_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-._")
    if not slug or slug in {".", ".."}:
        raise ValueError("Dataset name must contain letters or numbers")
    return slug[:80]


def names_from_config(config: dict) -> list[str]:
    names = config.get("names", [])
    if isinstance(names, dict):
        return [str(names[key]) for key in sorted(names, key=lambda item: int(item))]
    if not isinstance(names, list) or not names:
        raise ValueError("data.yaml must define a non-empty names list")
    return [str(name) for name in names]


def find_dataset_yaml(root: Path) -> tuple[Path, dict, list[str]]:
    candidates = sorted(root.rglob("*.yaml")) + sorted(root.rglob("*.yml"))
    for candidate in candidates:
        try:
            config = yaml.safe_load(candidate.read_text(encoding="utf-8-sig")) or {}
            names = names_from_config(config)
            if any(config.get(key) for key in ("train", "val", "valid", "test")):
                return candidate, config, names
        except (OSError, UnicodeError, ValueError, yaml.YAMLError):
            continue
    raise FileNotFoundError("No usable YOLO data.yaml was found")


def safe_extract(source: Path, destination: Path) -> None:
    with zipfile.ZipFile(source) as archive:
        root = destination.resolve()
        for entry in archive.infolist():
            target = (destination / entry.filename).resolve()
            if target != root and root not in target.parents:
                raise ValueError(f"Unsafe ZIP member: {entry.filename}")
        archive.extractall(destination)


def split_value(config: dict, split: str):
    value = config.get(split)
    if value is None and split == "valid":
        value = config.get("val")
    if isinstance(value, list):
        value = value[0] if value else None
    return value


def resolve_image_directory(yaml_path: Path, config: dict, split: str) -> Path | None:
    value = split_value(config, split)
    config_root = yaml_path.parent
    configured_root = Path(str(config.get("path", ".")))
    if not configured_root.is_absolute():
        configured_root = config_root / configured_root
    candidates: list[Path] = []
    if value:
        raw = Path(str(value))
        if raw.is_absolute():
            candidates.append(raw)
        else:
            candidates.extend((configured_root / raw, config_root / raw))
            if raw.parts and raw.parts[0] == "..":
                candidates.append(config_root.joinpath(*raw.parts[1:]))
    candidates.extend(
        (
            config_root / split / "images",
            config_root / ("valid" if split == "valid" else split) / "images",
            yaml_path.parent.parent / split / "images",
        )
    )
    return next((candidate.resolve() for candidate in candidates if candidate.is_dir()), None)


def audit_split(image_dir: Path, names: list[str]) -> dict:
    label_dir = image_dir.parent / "labels"
    images = sorted(path for path in image_dir.iterdir() if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)
    labels = sorted(label_dir.glob("*.txt")) if label_dir.is_dir() else []
    image_stems = {path.stem for path in images}
    label_stems = {path.stem for path in labels}
    class_counts: Counter[int] = Counter()
    invalid_rows: list[dict] = []
    instances = 0
    for label in labels:
        for line_number, row in enumerate(label.read_text(encoding="utf-8-sig").splitlines(), start=1):
            if not row.strip():
                continue
            fields = row.split()
            valid = len(fields) == 5
            try:
                class_id = int(fields[0])
                coordinates = [float(value) for value in fields[1:]]
                valid = valid and 0 <= class_id < len(names) and all(0 <= value <= 1 for value in coordinates)
            except (ValueError, IndexError):
                class_id = -1
                valid = False
            if valid:
                class_counts[class_id] += 1
                instances += 1
            elif len(invalid_rows) < 100:
                invalid_rows.append({"file": label.name, "line": line_number, "value": row})
    return {
        "images": len(images),
        "labels": len(labels),
        "instances": instances,
        "missing_labels": sorted(image_stems - label_stems)[:100],
        "orphan_labels": sorted(label_stems - image_stems)[:100],
        "invalid_rows": invalid_rows,
        "class_counts": {names[index]: class_counts[index] for index in range(len(names)) if class_counts[index]},
    }


def relative_posix(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def import_dataset(source: Path, registry: Path, requested_name: str | None, force: bool) -> dict:
    source = source.resolve()
    if not source.exists():
        raise FileNotFoundError(f"Dataset source not found: {source}")
    default_name = source.stem if source.is_file() else source.name
    slug = dataset_slug(requested_name or default_name)
    registry.mkdir(parents=True, exist_ok=True)
    destination = (registry / slug).resolve()
    if destination.parent != registry.resolve():
        raise ValueError("Dataset destination escaped the registry")
    if destination.exists():
        if not force or not (destination / MARKER).is_file():
            raise FileExistsError(f"Dataset already exists: {slug}; pass --force to replace an imported dataset")

    staging = (registry / f".importing-{slug}-{uuid.uuid4().hex[:8]}").resolve()
    try:
        staging.mkdir(parents=True)
        if source.is_file():
            if source.suffix.lower() != ".zip" or not zipfile.is_zipfile(source):
                raise ValueError("Dataset source must be a YOLO ZIP archive or directory")
            safe_extract(source, staging)
        elif source.is_dir():
            shutil.copytree(source, staging, dirs_exist_ok=True)
        else:
            raise ValueError("Unsupported dataset source")

        yaml_path, config, names = find_dataset_yaml(staging)
        splits: dict[str, Path] = {}
        audit: dict[str, dict] = {}
        for split in ("train", "valid", "test"):
            image_dir = resolve_image_directory(yaml_path, config, split)
            if image_dir is None or staging not in image_dir.parents:
                continue
            splits[split] = image_dir
            audit[split] = audit_split(image_dir, names)
        if not splits or not any(report["images"] for report in audit.values()):
            raise ValueError("Dataset contains no supported images")
        invalid_count = sum(len(report["invalid_rows"]) for report in audit.values())
        if invalid_count:
            raise ValueError(f"Dataset contains invalid YOLO annotation rows: {invalid_count}")

        portable_config = {
            "path": ".",
            "nc": len(names),
            "names": names,
        }
        if "train" in splits:
            portable_config["train"] = relative_posix(splits["train"], staging)
        if "valid" in splits:
            portable_config["val"] = relative_posix(splits["valid"], staging)
        if "test" in splits:
            portable_config["test"] = relative_posix(splits["test"], staging)
        (staging / "data.local.yaml").write_text(
            yaml.safe_dump(portable_config, sort_keys=False, allow_unicode=True), encoding="utf-8"
        )
        manifest = {
            "schema_version": 1,
            "name": slug,
            "source_name": source.name,
            "classes": names,
            "class_count": len(names),
            "splits": audit,
            "config": "data.local.yaml",
        }
        (staging / "dataset-manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        (staging / MARKER).write_text("managed by PPE Sentinel\n", encoding="ascii")
        if destination.exists():
            shutil.rmtree(destination)
        staging.replace(destination)
        manifest["directory"] = str(destination)
        manifest["config_path"] = str(destination / "data.local.yaml")
        return manifest
    finally:
        if staging.exists():
            shutil.rmtree(staging, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="YOLO ZIP archive or extracted dataset directory")
    parser.add_argument("--name", help="Registry name; defaults to the source filename")
    parser.add_argument("--registry", type=Path, default=Path("datasets"))
    parser.add_argument("--force", action="store_true", help="Replace a dataset previously imported by this tool")
    parser.add_argument("--json", action="store_true", help="Write only machine-readable JSON to stdout")
    args = parser.parse_args()
    try:
        result = import_dataset(args.source, args.registry.resolve(), args.name, args.force)
    except Exception as exc:
        payload = {"ok": False, "error": str(exc)}
        if args.json:
            print(json.dumps(payload, ensure_ascii=False))
        else:
            print(f"Dataset import failed: {exc}", file=sys.stderr)
        return 1
    payload = {"ok": True, "dataset": result}
    print(json.dumps(payload, ensure_ascii=False) if args.json else json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

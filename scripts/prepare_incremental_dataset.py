#!/usr/bin/env python3
"""Prepare a 28-class YOLO dataset by merging PPE extension exports.

The script accepts extracted YOLO datasets or Roboflow ZIP exports.  Existing
Construction Site Safety labels keep their original IDs; supported source
classes are remapped into the existing IDs and three new IDs:
25 Goggles, 26 Coverall, 27 Ear Protection.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

import yaml


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
BASE_NAMES = [
    "Excavator", "Gloves", "Hardhat", "Ladder", "Mask", "NO-Hardhat",
    "NO-Mask", "NO-Safety Vest", "Person", "SUV", "Safety Cone",
    "Safety Vest", "bus", "dump truck", "fire hydrant", "machinery",
    "mini-van", "sedan", "semi", "trailer", "truck", "truck and trailer",
    "van", "vehicle", "wheel loader",
]
NAMES = BASE_NAMES + ["Goggles", "Coverall", "Ear Protection"]


def key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


SOURCE_TO_TARGET = {
    key("mask"): 4,
    key("gloves"): 1,
    key("glove"): 1,
    key("hardhat"): 2,
    key("helmet"): 2,
    key("person"): 8,
    key("safety vest"): 11,
    key("vest"): 11,
    key("goggles"): 25,
    key("goggle"): 25,
    key("glass"): 25,
    key("safety glasses"): 25,
    key("coverall"): 26,
    key("coveralls"): 26,
    key("ear protection"): 27,
    key("ear-protection"): 27,
    key("earmuffs"): 27,
    key("earmuff"): 27,
}
REQUIRED_NEW = {25, 26, 27}


def names_from_config(config: dict) -> list[str]:
    names = config.get("names", [])
    if isinstance(names, dict):
        return [str(names[index]) for index in sorted(names, key=lambda value: int(value))]
    if not isinstance(names, list):
        raise ValueError("data YAML must contain a list or integer-keyed mapping named 'names'")
    return [str(name) for name in names]


def find_yaml(root: Path) -> Path:
    candidates = sorted(root.rglob("*.yaml")) + sorted(root.rglob("*.yml"))
    candidates = [path for path in candidates if path.name.lower() not in {"data.local.yaml"}]
    for path in candidates:
        try:
            config = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
            names_from_config(config)
            if "train" in config and ("val" in config or "valid" in config):
                return path
        except (OSError, UnicodeError, ValueError, yaml.YAMLError):
            continue
    raise FileNotFoundError(f"No YOLO data YAML found below {root}")


def inspect_zip(path: Path) -> tuple[str, list[str]] | None:
    try:
        with zipfile.ZipFile(path) as archive:
            candidates = [
                entry for entry in archive.namelist()
                if Path(entry).name.lower() in {"data.yaml", "data.yml"}
            ]
            for entry in candidates:
                try:
                    config = yaml.safe_load(archive.read(entry).decode("utf-8")) or {}
                    names = names_from_config(config)
                except (UnicodeError, ValueError, yaml.YAMLError):
                    continue
                mapped = {SOURCE_TO_TARGET.get(key(name)) for name in names}
                if REQUIRED_NEW & mapped:
                    return entry, names
    except (OSError, zipfile.BadZipFile):
        return None
    return None


def safe_extract(archive_path: Path, destination: Path) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path) as archive:
        root = destination.resolve()
        for entry in archive.infolist():
            target = (destination / entry.filename).resolve()
            if target != root and root not in target.parents:
                raise ValueError(f"Unsafe ZIP path in {archive_path.name}: {entry.filename}")
        archive.extractall(destination)
    return find_yaml(destination)


def resolve_split(yaml_path: Path, config: dict, split: str) -> tuple[Path, Path] | None:
    value = config.get(split)
    if value is None and split == "valid":
        value = config.get("val")
    if value is None:
        return None
    if isinstance(value, list):
        value = value[0] if value else None
    if not value:
        return None
    raw_path = Path(str(value))
    candidates = [raw_path] if raw_path.is_absolute() else [yaml_path.parent / raw_path]
    # Some Roboflow exports keep data.yaml at the dataset root while retaining
    # a legacy ../ prefix.  Prefer the literal path, then the actual split path.
    if not raw_path.is_absolute() and raw_path.parts and raw_path.parts[0] == "..":
        candidates.append(yaml_path.parent.joinpath(*raw_path.parts[1:]))
    candidates.extend([
        yaml_path.parent / split / "images",
        yaml_path.parent / ("valid" if split == "valid" else split) / "images",
    ])
    image_dir = next((candidate.resolve() for candidate in candidates if candidate.is_dir()), None)
    if image_dir is None:
        return None
    label_dir = image_dir.parent / "labels"
    if not label_dir.is_dir():
        candidate = yaml_path.parent / split / "labels"
        label_dir = candidate if candidate.is_dir() else label_dir
    return image_dir, label_dir


def unique_stem(source_name: str, image: Path, used: set[str]) -> str:
    digest = hashlib.sha1(str(image).encode("utf-8")).hexdigest()[:8]
    prefix = f"{key(source_name)[:24] or 'source'}_{digest}"
    stem = f"{prefix}_{image.stem}"
    if stem not in used:
        used.add(stem)
        return stem
    counter = 2
    while f"{stem}_{counter}" in used:
        counter += 1
    result = f"{stem}_{counter}"
    used.add(result)
    return result


def convert_source(source_name: str, yaml_path: Path, output: Path) -> dict:
    config = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
    source_names = names_from_config(config)
    id_map = {index: SOURCE_TO_TARGET.get(key(name)) for index, name in enumerate(source_names)}
    mapped_targets = {target for target in id_map.values() if target is not None}
    if not REQUIRED_NEW & mapped_targets:
        raise ValueError(f"{source_name} has no Goggles/Coverall/Ear Protection class")

    counts = Counter()
    split_counts = defaultdict(Counter)
    used_stems = set()
    copied_images = 0
    for split in ("train", "valid", "test"):
        resolved = resolve_split(yaml_path, config, split)
        if resolved is None:
            continue
        image_dir, label_dir = resolved
        destination_images = output / split / "images"
        destination_labels = output / split / "labels"
        destination_images.mkdir(parents=True, exist_ok=True)
        destination_labels.mkdir(parents=True, exist_ok=True)
        for image in sorted(image_dir.iterdir()):
            if not image.is_file() or image.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            label = label_dir / f"{image.stem}.txt"
            if not label.is_file():
                continue
            converted: list[str] = []
            for line in label.read_text(encoding="utf-8").splitlines():
                fields = line.split()
                if len(fields) != 5:
                    continue
                try:
                    source_id = int(fields[0])
                    coordinates = [float(value) for value in fields[1:]]
                except ValueError:
                    continue
                target_id = id_map.get(source_id)
                if target_id is None or not all(0 <= value <= 1 for value in coordinates):
                    continue
                converted.append(" ".join([str(target_id), *fields[1:]]))
                counts[target_id] += 1
                split_counts[split][target_id] += 1
            if not converted:
                continue
            stem = unique_stem(source_name, image, used_stems)
            shutil.copy2(image, destination_images / f"{stem}{image.suffix.lower()}")
            (destination_labels / f"{stem}.txt").write_text("\n".join(converted) + "\n", encoding="utf-8")
            copied_images += 1
    return {
        "source": source_name,
        "yaml": str(yaml_path),
        "source_names": source_names,
        "mapped_classes": {str(index): NAMES[target] for index, target in id_map.items() if target is not None},
        "images": copied_images,
        "instances": {NAMES[index]: count for index, count in sorted(counts.items())},
        "split_instances": {
            split: {NAMES[index]: count for index, count in sorted(values.items())}
            for split, values in sorted(split_counts.items())
        },
    }


def write_yaml(path: Path, train: list[str], valid: list[str], test: list[str], dataset_root: Path) -> None:
    payload = {
        "path": str(dataset_root.resolve()).replace("\\", "/"),
        "train": [str(item).replace("\\", "/") for item in train],
        "val": [str(item).replace("\\", "/") for item in valid],
        "test": [str(item).replace("\\", "/") for item in test],
        "nc": len(NAMES),
        "names": NAMES,
    }
    path.write_text(yaml.safe_dump(payload, sort_keys=False, allow_unicode=True), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path, default=Path("work/css-yolo26"))
    parser.add_argument("--output", type=Path, default=Path("work/ppe-incremental"))
    parser.add_argument("--source", type=Path, action="append", help="Extracted YOLO root or ZIP; repeatable")
    parser.add_argument("--force", action="store_true", help="Replace a previous generated output")
    args = parser.parse_args()
    base = args.base.resolve()
    output = args.output.resolve()
    base_yaml = base / "data.local.yaml"
    if not base_yaml.is_file():
        print(f"Base dataset YAML not found: {base_yaml}", file=sys.stderr)
        return 2

    sources = [path.resolve() for path in (args.source or [])]
    if not sources:
        for candidate in sorted(base.parent.glob("*.zip")):
            if inspect_zip(candidate):
                sources.append(candidate.resolve())
        for candidate in sorted(base.parent.iterdir()):
            if candidate.is_dir() and candidate != base and candidate != output:
                try:
                    if REQUIRED_NEW & {SOURCE_TO_TARGET.get(key(name)) for name in names_from_config(yaml.safe_load(find_yaml(candidate).read_text(encoding="utf-8")) or {})}:
                        sources.append(candidate.resolve())
                except (FileNotFoundError, OSError, UnicodeError, ValueError, yaml.YAMLError):
                    continue
    if not sources:
        print("No extension dataset found. Download the Goggles/Coverall and Ear Protection datasets into work, then rerun.", file=sys.stderr)
        return 4
    if output.exists():
        marker = output / ".generated-by-prepare-incremental"
        if not args.force or not marker.is_file():
            print(f"Refusing to replace existing output without --force and marker: {output}", file=sys.stderr)
            return 5
        shutil.rmtree(output)
    output.mkdir(parents=True)
    (output / ".generated-by-prepare-incremental").write_text("generated\n", encoding="ascii")

    source_reports = []
    extracted_root = output / ".sources"
    for source in sources:
        if source.is_file() and source.suffix.lower() == ".zip":
            target = extracted_root / key(source.stem)
            yaml_path = safe_extract(source, target)
            source_name = source.stem
        elif source.is_dir():
            yaml_path = find_yaml(source)
            source_name = source.name
        else:
            print(f"Source not found: {source}", file=sys.stderr)
            return 2
        source_reports.append(convert_source(source_name, yaml_path, output))

    total = Counter()
    for report in source_reports:
        total.update(report["instances"])
    missing = [NAMES[index] for index in sorted(REQUIRED_NEW) if total[NAMES[index]] == 0]
    if missing:
        print(f"Required new classes are missing after remapping: {', '.join(missing)}", file=sys.stderr)
        return 6

    base_root = base.resolve()
    base_paths = {split: str((base_root / split / "images").resolve()) for split in ("train", "valid", "test")}
    new_paths = {split: str((output / split / "images").resolve()) for split in ("train", "valid", "test")}
    write_yaml(output / "data.incremental.yaml", [base_paths["train"], new_paths["train"]], [base_paths["valid"], new_paths["valid"]], [base_paths["test"], new_paths["test"]], output)
    write_yaml(output / "data.incremental-base.yaml", [base_paths["train"]], [base_paths["valid"]], [base_paths["test"]], output)
    write_yaml(output / "data.incremental-new.yaml", [new_paths["train"]], [new_paths["valid"]], [new_paths["test"]], output)
    report = {"classes": NAMES, "sources": source_reports, "total_instances": dict(total), "yaml": str((output / "data.incremental.yaml").resolve())}
    (output / "incremental_dataset_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Prepared: {output / 'data.incremental.yaml'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

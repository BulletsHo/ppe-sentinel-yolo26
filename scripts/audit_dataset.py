#!/usr/bin/env python3
"""Audit a Roboflow YOLO dataset without requiring a deep-learning runtime."""

from __future__ import annotations

import argparse
import ast
import csv
import json
import re
from collections import Counter
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def parse_data_yaml(path: Path) -> dict:
    """Parse the small, flat Roboflow data.yaml format used by this dataset."""
    text = path.read_text(encoding="utf-8")
    result: dict = {}
    for key in ("train", "val", "test", "nc"):
        match = re.search(rf"^\s*{key}:\s*(.+?)\s*$", text, flags=re.MULTILINE)
        if match:
            value = match.group(1).strip()
            try:
                result[key] = int(value)
            except ValueError:
                result[key] = value.strip("'\"")
    names_match = re.search(r"^\s*names:\s*(\[.*\])\s*$", text, flags=re.MULTILINE)
    if names_match:
        result["names"] = ast.literal_eval(names_match.group(1))
    return result


def audit_split(root: Path, split: str, names: list[str]) -> dict:
    image_dir = root / split / "images"
    label_dir = root / split / "labels"
    images = sorted(p for p in image_dir.glob("*") if p.suffix.lower() in IMAGE_EXTENSIONS)
    labels = sorted(label_dir.glob("*.txt"))
    image_stems = {p.stem for p in images}
    label_stems = {p.stem for p in labels}
    missing_labels = sorted(image_stems - label_stems)
    orphan_labels = sorted(label_stems - image_stems)
    class_counts = Counter()
    invalid_rows = []
    empty_labels = []
    instances = 0
    for label in labels:
        rows = [line.strip() for line in label.read_text(encoding="utf-8").splitlines() if line.strip()]
        if not rows:
            empty_labels.append(label.name)
        for line_no, row in enumerate(rows, start=1):
            fields = row.split()
            valid = len(fields) == 5
            try:
                class_id = int(fields[0])
                coords = [float(value) for value in fields[1:]]
                valid = valid and 0 <= class_id < len(names) and all(0 <= value <= 1 for value in coords)
            except (ValueError, IndexError):
                valid = False
                class_id = -1
            if not valid:
                invalid_rows.append({"file": label.name, "line": line_no, "value": row})
            else:
                class_counts[class_id] += 1
                instances += 1
    return {
        "images": len(images),
        "labels": len(labels),
        "instances": instances,
        "missing_labels": missing_labels,
        "orphan_labels": orphan_labels,
        "empty_labels": empty_labels,
        "invalid_rows": invalid_rows,
        "class_counts": {str(index): class_counts[index] for index in range(len(names))},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="Extracted dataset root containing data.yaml")
    parser.add_argument("--output", type=Path, required=True, help="JSON audit output path")
    args = parser.parse_args()
    root = args.root.resolve()
    config = parse_data_yaml(root / "data.yaml")
    names = config.get("names", [])
    report = {
        "dataset_root": str(root),
        "data_yaml": str(root / "data.yaml"),
        "nc": config.get("nc"),
        "names": names,
        "splits": {split: audit_split(root, split, names) for split in ("train", "valid", "test")},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    csv_path = args.output.with_name("dataset-class-counts.csv")
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow(["split", "class_id", "class_name", "instances"])
        for split, split_report in report["splits"].items():
            for class_id, count in split_report["class_counts"].items():
                writer.writerow([split, class_id, names[int(class_id)], count])
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Wrote {args.output}")
    print(f"Wrote {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

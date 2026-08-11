#!/usr/bin/env python3
"""Run a real Ultralytics YOLO26 validation and persist machine-readable results."""

from __future__ import annotations

import argparse
import json
import platform
import sys
import time
from pathlib import Path

from runtime_bootstrap import load_ultralytics


def optional_float(value):
    return None if value is None else float(value)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True, help="YOLO26 .pt/.onnx model (trained for this dataset)")
    parser.add_argument("--data", type=Path, required=True, help="Dataset data.yaml")
    parser.add_argument("--split", default="test", choices=("train", "val", "test"))
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--conf", type=float, default=0.001)
    parser.add_argument("--iou", type=float, default=0.7)
    parser.add_argument("--device", default="0", help="CUDA device id, cpu, or auto")
    parser.add_argument("--workers", type=int, default=0)
    parser.add_argument("--project", type=Path, default=Path("outputs/yolo26-eval"))
    parser.add_argument("--name", default="test")
    parser.add_argument("--ultralytics-site-packages", type=Path)
    args = parser.parse_args()
    if not args.model.is_file():
        print(f"Model not found: {args.model}", file=sys.stderr)
        return 2
    if not args.data.is_file():
        print(f"Dataset YAML not found: {args.data}", file=sys.stderr)
        return 2
    try:
        torch, YOLO = load_ultralytics(args.ultralytics_site_packages)
    except Exception as exc:  # pragma: no cover - exercised on setup machines
        print("Ultralytics YOLO26 evaluation requires torch and ultralytics.", file=sys.stderr)
        print(f"Import error: {exc}", file=sys.stderr)
        print("Install with: python -m pip install -U ultralytics", file=sys.stderr)
        return 3
    device = args.device
    if device == "auto":
        device = "0" if torch.cuda.is_available() else "cpu"
    project = args.project.resolve()
    model = YOLO(str(args.model))
    start = time.perf_counter()
    metrics = model.val(
        data=str(args.data),
        split=args.split,
        imgsz=args.imgsz,
        conf=args.conf,
        iou=args.iou,
        device=device,
        workers=args.workers,
        project=str(project),
        name=args.name,
        plots=True,
        verbose=True,
    )
    elapsed = time.perf_counter() - start
    box = getattr(metrics, "box", None)
    names = getattr(metrics, "names", getattr(model, "names", {}))
    if not isinstance(names, dict):
        names = {index: name for index, name in enumerate(names)}
    class_indices = [int(index) for index in getattr(box, "ap_class_index", range(len(getattr(box, "ap50", []))))]
    ap50_values = [float(value) for value in getattr(box, "ap50", [])]
    ap_values = [float(value) for value in getattr(box, "ap", [])]
    per_class = [
        {
            "class_id": class_id,
            "class_name": names.get(class_id, str(class_id)),
            "ap50": ap50_values[position],
            "ap50_95": ap_values[position],
        }
        for position, class_id in enumerate(class_indices)
    ]
    result = {
        "model": str(args.model.resolve()),
        "data": str(args.data.resolve()),
        "split": args.split,
        "imgsz": args.imgsz,
        "conf": args.conf,
        "iou": args.iou,
        "device": device,
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_available": bool(torch.cuda.is_available()),
        "elapsed_seconds": elapsed,
        "metrics": {
            "precision": optional_float(getattr(box, "mp", None)),
            "recall": optional_float(getattr(box, "mr", None)),
            "map50": optional_float(getattr(box, "map50", None)),
            "map50_95": optional_float(getattr(box, "map", None)),
            "per_class_ap50": ap50_values,
            "per_class_ap50_95": ap_values,
            "per_class": per_class,
        },
        "results_dir": str(getattr(metrics, "save_dir", project / args.name)),
    }
    output = Path(result["results_dir"]) / "metrics.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

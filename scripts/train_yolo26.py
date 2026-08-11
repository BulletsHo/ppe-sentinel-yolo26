#!/usr/bin/env python3
"""Fine-tune a YOLO26 detector for the Construction Site Safety dataset."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from runtime_bootstrap import load_ultralytics


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default="yolo26n.pt", help="YOLO26 checkpoint name or local path")
    parser.add_argument("--data", type=Path, required=True, help="Dataset data.yaml")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--device", default="0", help="CUDA device id, cpu, or auto")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--project", type=Path, default=Path("outputs/yolo26-train"))
    parser.add_argument("--name", default="ppe-yolo26n")
    parser.add_argument("--ultralytics-site-packages", type=Path)
    args = parser.parse_args()
    if not args.data.is_file():
        print(f"Dataset YAML not found: {args.data}", file=sys.stderr)
        return 2
    try:
        torch, YOLO = load_ultralytics(args.ultralytics_site_packages)
    except Exception as exc:  # pragma: no cover - exercised on setup machines
        print("Training requires torch and ultralytics.", file=sys.stderr)
        print(f"Import error: {exc}", file=sys.stderr)
        return 3
    device = args.device
    if device == "auto":
        device = "0" if torch.cuda.is_available() else "cpu"
    project = args.project.resolve()
    model = YOLO(args.model)
    model.train(
        data=str(args.data),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        workers=args.workers,
        project=str(project),
        name=args.name,
        pretrained=True,
        patience=20,
        plots=True,
        exist_ok=True,
    )
    best = Path(model.trainer.save_dir) / "weights" / "best.pt"
    print(f"Best checkpoint: {best}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

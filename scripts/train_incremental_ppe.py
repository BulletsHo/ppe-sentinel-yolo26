#!/usr/bin/env python3
"""Fine-tune the current YOLO26 PPE model with the 28-class merged dataset."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from runtime_bootstrap import load_ultralytics


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=Path("outputs/yolo26-train/ppe-yolo26n/weights/best.pt"))
    parser.add_argument("--data", type=Path, default=Path("work/ppe-incremental/data.incremental.yaml"))
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--device", default="auto", help="CUDA device id, cpu, or auto")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--project", type=Path, default=Path("outputs/yolo26-train"))
    parser.add_argument("--name", default="ppe-yolo26n-incremental")
    parser.add_argument("--ultralytics-site-packages", type=Path)
    args = parser.parse_args()
    model_path = args.model.resolve()
    data_path = args.data.resolve()
    if not model_path.is_file():
        print(f"Starting checkpoint not found: {model_path}", file=sys.stderr)
        return 2
    if not data_path.is_file():
        print(f"Incremental dataset YAML not found: {data_path}", file=sys.stderr)
        print("Run scripts/prepare_incremental_dataset.py after downloading all extension ZIPs.", file=sys.stderr)
        return 2
    try:
        torch, YOLO = load_ultralytics(args.ultralytics_site_packages)
    except Exception as exc:
        print(f"Training requires torch and ultralytics: {exc}", file=sys.stderr)
        return 3
    device = args.device
    if device == "auto":
        device = "0" if torch.cuda.is_available() else "cpu"
    model = YOLO(str(model_path))
    model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        workers=args.workers,
        project=str(args.project.resolve()),
        name=args.name,
        pretrained=True,
        patience=20,
        plots=True,
        exist_ok=True,
    )
    best = Path(model.trainer.save_dir) / "weights" / "best.pt"
    if not best.is_file():
        print(f"Training finished without a best checkpoint: {best}", file=sys.stderr)
        return 5
    print(f"Best checkpoint: {best.resolve()}")
    print(f"Classes: {len(model.names)} ({', '.join(str(name) for name in model.names.values())})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

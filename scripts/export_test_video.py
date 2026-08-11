#!/usr/bin/env python3
"""Render YOLO26 predictions for a test image split into a fixed-size MP4."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

from runtime_bootstrap import load_ultralytics


def letterbox(frame, width: int, height: int, cv2):
    """Resize while preserving aspect ratio and pad to a stable video canvas."""
    source_height, source_width = frame.shape[:2]
    scale = min(width / source_width, height / source_height)
    resized_width = max(1, round(source_width * scale))
    resized_height = max(1, round(source_height * scale))
    resized = cv2.resize(frame, (resized_width, resized_height), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    offset_x = (width - resized_width) // 2
    offset_y = (height - resized_height) // 2
    canvas[offset_y : offset_y + resized_height, offset_x : offset_x + resized_width] = resized
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--images", type=Path, required=True, help="Directory containing test images")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--iou", type=float, default=0.7)
    parser.add_argument("--device", default="0")
    parser.add_argument("--fps", type=float, default=8.0)
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=720)
    parser.add_argument("--ultralytics-site-packages", type=Path)
    args = parser.parse_args()
    if not args.model.is_file():
        print(f"Model not found: {args.model}", file=sys.stderr)
        return 2
    if not args.images.is_dir():
        print(f"Image directory not found: {args.images}", file=sys.stderr)
        return 2
    image_paths = sorted(
        path for path in args.images.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    )
    if not image_paths:
        print(f"No images found in {args.images}", file=sys.stderr)
        return 2
    try:
        import cv2
        torch, YOLO = load_ultralytics(args.ultralytics_site_packages)
    except Exception as exc:
        print(f"Video export requires OpenCV, torch, and ultralytics: {exc}", file=sys.stderr)
        return 3
    device = args.device
    if device == "auto":
        device = "0" if torch.cuda.is_available() else "cpu"
    model = YOLO(str(args.model))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(args.output),
        cv2.VideoWriter_fourcc(*"mp4v"),
        args.fps,
        (args.width, args.height),
    )
    if not writer.isOpened():
        print(f"Could not open video writer: {args.output}", file=sys.stderr)
        return 4
    try:
        results = model.predict(
            source=[str(path) for path in image_paths],
            stream=True,
            batch=8,
            imgsz=args.imgsz,
            conf=args.conf,
            iou=args.iou,
            device=device,
            verbose=False,
        )
        for index, (path, result) in enumerate(zip(image_paths, results), start=1):
            annotated = result.plot()
            frame = letterbox(annotated, args.width, args.height, cv2)
            cv2.rectangle(frame, (0, 0), (args.width, 42), (12, 17, 23), -1)
            label = f"YOLO26 PPE | test {index}/{len(image_paths)} | {path.name}"
            cv2.putText(frame, label, (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (230, 240, 245), 1, cv2.LINE_AA)
            writer.write(frame)
    finally:
        writer.release()
    print(f"Wrote {args.output.resolve()}")
    print(f"Frames: {len(image_paths)}; FPS: {args.fps}; Duration: {len(image_paths) / args.fps:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

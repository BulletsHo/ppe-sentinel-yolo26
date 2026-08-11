#!/usr/bin/env python3
"""Local HTTP inference service for the PPE Sentinel camera page."""

from __future__ import annotations

import argparse
import json
import sys
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from runtime_bootstrap import load_ultralytics


MAX_IMAGE_BYTES = 5 * 1024 * 1024


class PPEInferenceService:
    def __init__(self, model_path: Path, device: str, imgsz: int, site_packages: Path | None):
        import cv2

        self.cv2 = cv2
        self.torch, YOLO = load_ultralytics(site_packages)
        self.device = "0" if device == "auto" and self.torch.cuda.is_available() else device
        self.imgsz = imgsz
        self.model = YOLO(str(model_path))
        self.lock = threading.Lock()
        self.model_name = model_path.name

    def health(self) -> dict[str, object]:
        return {
            "status": "ready",
            "model": self.model_name,
            "device": str(self.device),
            "cuda": bool(self.torch.cuda.is_available()),
            "imgsz": self.imgsz,
            "classes": [str(name) for name in self.model.names.values()],
        }

    def infer(
        self, image_bytes: bytes, conf: float, iou: float, class_ids: list[int] | None
    ) -> dict[str, object]:
        import time

        import numpy as np

        image = self.cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), self.cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("The request body is not a readable image")

        started = time.perf_counter()
        # Ultralytics models are not re-entrant. Serializing calls keeps concurrent
        # browser requests from corrupting the CUDA execution context.
        with self.lock:
            result = self.model.predict(
                source=image,
                imgsz=self.imgsz,
                conf=conf,
                iou=iou,
                device=self.device,
                classes=class_ids,
                verbose=False,
            )[0]
        elapsed_ms = (time.perf_counter() - started) * 1000
        names = result.names
        detections: list[dict[str, object]] = []
        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls.item())
                x1, y1, x2, y2 = (round(float(value), 2) for value in box.xyxy[0].tolist())
                detections.append(
                    {
                        "class_id": class_id,
                        "label": str(names[class_id]),
                        "confidence": round(float(box.conf.item()), 5),
                        "xyxy": [x1, y1, x2, y2],
                    }
                )
        detections.sort(key=lambda item: float(item["confidence"]), reverse=True)
        height, width = image.shape[:2]
        return {
            "width": width,
            "height": height,
            "detections": detections,
            "inference_ms": round(elapsed_ms, 2),
        }


def parse_float(value: str | None, default: float, minimum: float, maximum: float) -> float:
    try:
        parsed = float(value) if value is not None else default
    except ValueError:
        return default
    return min(max(parsed, minimum), maximum)


def parse_class_ids(value: str | None, class_count: int) -> list[int] | None:
    if not value:
        return None
    parsed: set[int] = set()
    for raw_id in value.split(","):
        try:
            class_id = int(raw_id.strip())
        except ValueError:
            continue
        if 0 <= class_id < class_count:
            parsed.add(class_id)
    return sorted(parsed) or None


def make_handler(service: PPEInferenceService):
    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt: str, *args):
            print(f"[{self.log_date_time_string()}] {fmt % args}", flush=True)

        def send_json(self, status: HTTPStatus, payload: dict[str, object]):
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path.split("?", 1)[0] == "/health":
                self.send_json(HTTPStatus.OK, service.health())
                return
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

        def do_POST(self):
            if self.path.split("?", 1)[0] != "/infer":
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if length <= 0 or length > MAX_IMAGE_BYTES:
                self.send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "Image must be 1 byte to 5 MB"})
                return
            try:
                image = self.rfile.read(length)
                result = service.infer(
                    image,
                    parse_float(self.headers.get("X-PPE-Confidence"), 0.65, 0.01, 0.99),
                    parse_float(self.headers.get("X-PPE-IoU"), 0.70, 0.01, 0.99),
                    parse_class_ids(self.headers.get("X-PPE-Classes"), len(service.model.names)),
                )
            except ValueError as exc:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            except Exception as exc:  # Keep backend errors from breaking the camera page.
                print(f"Inference error: {exc}", file=sys.stderr, flush=True)
                self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Inference failed"})
                return
            self.send_json(HTTPStatus.OK, result)

    return Handler


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4176)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--imgsz", type=int, default=512)
    parser.add_argument("--ultralytics-site-packages", type=Path)
    args = parser.parse_args()
    if not args.model.is_file():
        print(f"Model not found: {args.model}", file=sys.stderr)
        return 2
    try:
        service = PPEInferenceService(
            args.model.resolve(), args.device, args.imgsz, args.ultralytics_site_packages
        )
    except Exception as exc:
        print(f"Unable to load PPE model: {exc}", file=sys.stderr)
        return 3
    server = ThreadingHTTPServer((args.host, args.port), make_handler(service))
    print(f"PPE inference ready at http://{args.host}:{args.port} ({service.model_name}, device={service.device})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

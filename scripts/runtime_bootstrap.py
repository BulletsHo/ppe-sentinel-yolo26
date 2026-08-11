"""Helpers for loading Ultralytics from a separate site-packages directory."""

from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path


def load_ultralytics(site_packages: Path | None = None):
    """Load CUDA PyTorch first, then optionally reuse a separate Ultralytics install."""
    os.environ.setdefault("YOLO_CONFIG_DIR", str((Path.cwd() / "outputs").resolve()))
    import torch

    if site_packages:
        site_packages = site_packages.resolve()
        if not site_packages.is_dir():
            raise FileNotFoundError(f"Ultralytics site-packages not found: {site_packages}")
        # Keep the CUDA environment's compiled packages loaded before exposing the
        # second environment, whose Ultralytics installation uses CPU-only PyTorch.
        for module in ("torchvision", "numpy", "cv2", "yaml", "matplotlib", "scipy", "PIL", "requests", "psutil"):
            importlib.import_module(module)
        for module in tuple(sys.modules):
            if module == "filelock" or module.startswith("filelock."):
                sys.modules.pop(module, None)
        sys.path.insert(0, str(site_packages))

    from ultralytics import YOLO

    return torch, YOLO

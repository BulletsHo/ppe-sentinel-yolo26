# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

ultralytics_datas, ultralytics_binaries, ultralytics_hidden = collect_all("ultralytics")

analysis = Analysis(
    ["../scripts/camera_inference_server.py"],
    pathex=["../scripts"],
    binaries=ultralytics_binaries,
    datas=ultralytics_datas,
    hiddenimports=ultralytics_hidden + ["cv2", "numpy", "torch", "torchvision", "yaml"],
    hookspath=[],
    runtime_hooks=[],
    excludes=["tkinter"],
    noarchive=False,
)
pyz = PYZ(analysis.pure)
executable = EXE(
    pyz,
    analysis.scripts,
    analysis.binaries,
    analysis.datas,
    [],
    name="ppe-inference",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)

# -*- mode: python ; coding: utf-8 -*-

analysis = Analysis(
    ["../scripts/import_dataset.py"],
    pathex=["../scripts"],
    binaries=[],
    datas=[],
    hiddenimports=["yaml"],
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
    name="ppe-dataset-importer",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)

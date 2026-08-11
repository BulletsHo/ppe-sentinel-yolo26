#!/usr/bin/env python3
"""Build standalone inference and dataset-maintenance executables."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    output = root / "dist" / "backend"
    work = root / "build" / "pyinstaller"
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    work.mkdir(parents=True, exist_ok=True)
    for spec in ("ppe-inference.spec", "ppe-dataset-importer.spec"):
        command = [
            sys.executable,
            "-m",
            "PyInstaller",
            "--noconfirm",
            "--clean",
            "--distpath",
            str(output),
            "--workpath",
            str(work / Path(spec).stem),
            str(root / "packaging" / spec),
        ]
        subprocess.run(command, cwd=root / "packaging", check=True)
    print(f"Desktop backends written to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

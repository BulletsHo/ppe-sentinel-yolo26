#!/usr/bin/env python3
"""Fail when files eligible for release contain common personal or secret data."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
RELEASE_FILES = {
    ".dockerignore",
    ".env.example",
    ".gitignore",
    "Caddyfile",
    "CONTRIBUTING.md",
    "Dockerfile",
    "LICENSE",
    "PPE_EXTENSION_PLAN.md",
    "README.md",
    "SECURITY.md",
    "THIRD_PARTY_NOTICES.md",
    "YOLO26_PPE.md",
    "app.js",
    "docker-compose.yml",
    "index.html",
    "package.json",
    "requirements-build.txt",
    "requirements.txt",
    "server.cjs",
}
RELEASE_DIRECTORIES = {".github", "docs", "electron", "packaging", "scripts", "src", "tests"}
MODEL = Path("outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt")
SKIP_SUFFIXES = {".pyc", ".pyo"}

SLASH = rb"[\\/]"
PATTERNS = {
    "Windows user profile path": re.compile(rb"(?i)[a-z]:" + SLASH + rb"users" + SLASH + rb"[^\\/\x00\r\n]+"),
    "Unix user home path": re.compile(rb"(?i)/" + rb"(?:home|users)" + rb"/[^/\x00\r\n]+"),
    "email address": re.compile(rb"(?i)(?<![\w.+-])[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}(?![\w.-])"),
    "private key": re.compile(rb"-----BEGIN " + rb"(?:RSA |EC |OPENSSH )?" + rb"PRIVATE KEY-----"),
    "credential token": re.compile(
        rb"(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|"
        rb"sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})"
    ),
    "Windows security identifier": re.compile(rb"S-1-5-21(?:-\d+){3,}"),
}


def release_paths(root: Path) -> list[Path]:
    paths = [root / name for name in RELEASE_FILES]
    paths.append(root / MODEL)
    for name in RELEASE_DIRECTORIES:
        directory = root / name
        if directory.is_dir():
            paths.extend(path for path in directory.rglob("*") if path.is_file())
    return sorted({path for path in paths if path.is_file() and path.suffix.lower() not in SKIP_SUFFIXES})


def line_number(data: bytes, offset: int) -> int:
    return data.count(b"\n", 0, offset) + 1


def audit(root: Path) -> list[str]:
    findings: list[str] = []
    real_env = root / ".env"
    if real_env.exists():
        findings.append(".env: local environment files must never be released")
    for path in release_paths(root):
        try:
            data = path.read_bytes()
        except OSError as exc:
            findings.append(f"{path.relative_to(root)}: cannot read file: {exc}")
            continue
        for label, pattern in PATTERNS.items():
            match = pattern.search(data)
            if match:
                relative = path.relative_to(root)
                findings.append(f"{relative}:{line_number(data, match.start())}: possible {label}")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    root = args.root.resolve()
    findings = audit(root)
    if findings:
        print("Release privacy audit failed:", file=sys.stderr)
        for finding in findings:
            print(f"- {finding}", file=sys.stderr)
        return 1
    print(f"Release privacy audit passed ({len(release_paths(root))} files checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

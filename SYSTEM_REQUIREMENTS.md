# PPE Sentinel System Configuration Requirements

This document applies to PPE Sentinel YOLO26 `1.0.0`. Configurations are divided into three categories: real-time detection, public server deployment, and model training. Node.js or Python installation is not required when only running the packaged desktop application.

## 1. Minimum Configuration for Real-time Detection

| Component | Minimum Requirement | Recommended Configuration |
| --- | --- | --- |
| OS | Windows 10/11 64-bit; Ubuntu 22.04 64-bit | Windows 11 64-bit or Ubuntu 24.04 64-bit |
| CPU | 4-core x86-64 processor from the last 8 years | 6-core or above Intel Core i5/i7, AMD Ryzen 5/7 |
| RAM | 8 GB | 16 GB or above |
| GPU | Not strictly required, CPU inference is possible | NVIDIA CUDA graphics card, 6 GB VRAM or above |
| Available Disk | 8 GB, excluding datasets and logs | 20 GB or above |
| Camera | Supports UVC/system camera interfaces, 720p resolution | Built-in or USB 1080p camera |
| Display Resolution | 1280 x 720; minimum app window 840 x 640 | 1920 x 1080 or above |
| Browser | Modern browser supporting `getUserMedia` | Latest stable Edge or Chrome |

Apple Silicon/Intel macOS can be built using Electron's `dmg` target, but current release workflows primarily validate Windows and Linux. Camera, PyTorch, and signing processes should be re-tested on the target macOS version before official deployment.

CPU can run YOLO26n, but the frame rate depends on the processor, input resolution, and the number of enabled classes. For continuous real-time detection, an NVIDIA GPU is recommended. GPU acceleration is only enabled if the Python environment or desktop installer contains a compatible CUDA PyTorch.

## 2. Software Requirements for Running from Source

| Software | Requirement |
| --- | --- |
| Node.js | Version 20 or higher |
| npm | Installed with Node.js; `npm.cmd` is recommended in Windows PowerShell |
| Python | 3.10-3.12; 3.11 64-bit is recommended |
| Ultralytics | `8.4.117` |
| PyYAML | `6.x` |
| PyTorch/torchvision | Versions must match each other; PyTorch 2.7.x corresponds to torchvision 0.22.x |
| Git | Required for cloning and version management |

Basic installation:

```powershell
$env:npm_config_cache = Join-Path (Get-Location) ".npm-cache"
$env:PIP_CACHE_DIR = Join-Path (Get-Location) ".pip-cache"
.\scripts\setup.ps1
npm.cmd start
```

CUDA users should install the version matching their graphics driver from the official PyTorch index. The current inference service prioritizes CUDA when `PPE_DEVICE=auto`, otherwise it falls back to CPU. Do not mix mismatched torch and torchvision; this may result in missing operators or the inference process exiting.

## 3. Desktop Installer Build Requirements

The build process requires network access to download Electron, Electron Builder, PyInstaller, PyTorch, and related platform binaries.

| Software/Resource | Requirement |
| --- | --- |
| Electron | `39.x` |
| electron-builder | `26.x` |
| PyInstaller | `6.16` to strictly less than `7` |
| Windows Build Machine | Windows 10/11 64-bit, recommended 16 GB RAM, 20 GB available disk |
| Linux Build Machine | Ubuntu 22.04/24.04, recommended 16 GB RAM, 20 GB available disk |
| Network | Access to npm, Python Package Index, and GitHub Release download URLs |

Install build dependencies and generate the installer for the current OS:

```powershell
.\scripts\setup.ps1 -BuildTools
npm.cmd run privacy:audit
npm.cmd run dist:desktop
```

The Windows build generates an NSIS installer and a Portable version; the Linux build generates an AppImage. Installers for different operating systems should be built on the corresponding OS or GitHub Runner; cross-platform packaging is not recommended.

## 4. Public or LAN Deployment Requirements

| Component | Requirement |
| --- | --- |
| Docker | Docker Engine 24+ and Docker Compose v2, required when using container deployment |
| Domain | Public deployment requires a domain name resolvable to the server |
| Port | Caddy requires inbound TCP 80, TCP/UDP 443; the app container internally uses 4175 |
| HTTPS | Remote browser camera access must use HTTPS; except for `localhost` local access |
| Authentication | When `PPE_PUBLIC=1`, `PPE_USERNAME` and a long random `PPE_PASSWORD` must be configured |
| Upload Bandwidth | Stable connection required when importing large YOLO ZIP datasets |

Local mode listens on `127.0.0.1:4175`, and the Python inference service listens on `127.0.0.1:4176`. These two ports are only used for local process communication and should not be exposed directly to the public network. Docker/Caddy mode only exposes 80/443 and accesses the application via reverse proxy.

## 5. Dataset and Log Capacity

- The default upload limit for a single dataset ZIP is 2048 MB, which can be adjusted via `PPE_MAX_DATASET_UPLOAD_MB`.
- When extracting, validating, and registering datasets, it is recommended to reserve temporary disk space 2-3 times the size of the archive.
- Detection logs are JSONL files, and the storage volume depends on detection frequency and runtime; long-term operation should configure disk quotas, rotation, and backup strategies.
- Camera footage is not saved by default by the system; structured detection results are written only when detection logs are enabled.

## 6. Recommended Configuration for Incremental Training

Training is not a prerequisite for desktop real-time detection. When retraining or adding classes is needed, the following is recommended:

| Component | Minimum | Recommended Configuration |
| --- | --- | --- |
| CPU | 6 cores | 12 cores or above |
| RAM | 16 GB | 32-64 GB |
| GPU | NVIDIA CUDA, 8 GB VRAM; small batch training | NVIDIA RTX, 12-24 GB VRAM |
| Disk | 50 GB SSD | 100 GB NVMe SSD or above |
| Dataset | YOLO detection format, independent train/val/test | Contains positive and negative samples, occlusions, and different lighting scenarios |

VRAM required for training is affected by `imgsz`, `batch`, data augmentation, and model size. When VRAM is insufficient, lower the `batch` first, then consider lowering `imgsz`; CPU training is only suitable for functional verification and is not recommended for official incremental training.

## 7. Pre-launch Checklist

1. Run `npm.cmd run privacy:audit` to ensure the source code and model do not contain local paths or credentials.
2. Run `npm.cmd test` and `npm.cmd run build`.
3. Access `/healthz`, and confirm `/api/health` returns the model, device, and 28 classes.
4. Test built-in camera, USB camera, Chinese/English, and dark/light interfaces respectively.
5. Public deployment must verify HTTPS, Basic Auth, firewalls, and dataset upload capacity.
6. `Ear Protection` currently has insufficient samples and should not be used as an independent basis for compliance determination.

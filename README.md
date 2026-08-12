# PPE Sentinel YOLO26

PPE Sentinel is an open-source YOLO26 workplace-safety detector with a browser UI, a local Electron desktop app, a self-hosted HTTP service, and a maintained YOLO dataset import interface.

The bundled incremental model has 28 classes, including `Mask`, `Gloves`, `Goggles`, `Safety Vest`, `Coverall`, and `Ear Protection`. Ear Protection currently has limited representative validation data and must not be used as the sole basis for compliance decisions.

Detailed minimum, recommended, deployment, and training requirements are documented in [`docs/SYSTEM_REQUIREMENTS.md`](docs/SYSTEM_REQUIREMENTS.md).

The exact GitHub Actions setup and release procedure is documented in [`docs/GITHUB_ACTIONS_GUIDE.md`](docs/GITHUB_ACTIONS_GUIDE.md).

## Clone and setup

Requirements: Node.js 20+, Python 3.10+, and a working C/C++ runtime for the selected PyTorch build. From a clone of this repository:

```powershell
git clone https://github.com/BulletsHo/ppe-sentinel-yolo26.git
cd ppe-sentinel-yolo26
.\scripts\setup.ps1
npm start
```

Linux/macOS:

```sh
./scripts/setup.sh
npm start
```

Open `http://127.0.0.1:4175/`. The local server uses the bundled model at `outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt`.

## Desktop application

The Electron shell starts an isolated local server, selects an available port, and restricts camera permissions to the application origin.

```sh
npm install
npm run desktop
```

Build installers after installing the build dependencies:

```sh
npm run dist:desktop
```

Artifacts are written to `release/`. PyInstaller bundles the inference and dataset-import backends, so end users do not need Python installed.

## Public HTTPS deployment

Do not expose the development server without authentication. Copy `.env.example` to `.env`, set a long random `PPE_PASSWORD`, and point `PPE_DOMAIN` at a DNS record for the host. Docker Compose runs PPE Sentinel behind Caddy, which obtains and renews HTTPS certificates:

```sh
cp .env.example .env
# edit .env: PPE_DOMAIN, PPE_USERNAME, PPE_PASSWORD
docker compose up -d --build
```

Remote browser camera access requires HTTPS. The direct Node server also supports `PPE_TLS_CERT` and `PPE_TLS_KEY` for deployments that terminate TLS in the application process. `PPE_PUBLIC=1` requires both `PPE_USERNAME` and `PPE_PASSWORD` unless an explicitly configured authenticated gateway is used.

Useful environment variables:

| Variable | Purpose |
| --- | --- |
| `PPE_HOST` / `PORT` | Bind address and web port |
| `PPE_PUBLIC` | Public binding mode; requires Basic Auth |
| `PPE_USERNAME` / `PPE_PASSWORD` | HTTP Basic Auth credentials |
| `PPE_MODEL` | Model checkpoint path |
| `PPE_DEVICE` / `PPE_IMGSZ` | `cpu`, CUDA device, and inference size |
| `PPE_LOG_DIR` | Default JSONL detection-log directory |
| `PPE_DATASETS_DIR` | Dataset registry directory |
| `PPE_INFERENCE_EXECUTABLE` | Packaged inference backend override |
| `PPE_DATASET_IMPORT_EXECUTABLE` | Packaged dataset importer override |

## Dataset maintenance

The UI's maintenance panel accepts a YOLO-format ZIP archive, validates labels, blocks ZIP path traversal, creates a portable `data.local.yaml`, and records a `dataset-manifest.json`. Imports never start training automatically.

The same interface is available for automation:

```sh
# list imported datasets
curl http://127.0.0.1:4175/api/maintenance/datasets

# import a ZIP archive
curl -X POST -H "Content-Type: application/zip" \
  --data-binary @path/to/dataset.zip \
  "http://127.0.0.1:4175/api/maintenance/datasets/import?name=site-safety"
```

The CLI remains available for maintenance and CI:

```sh
npm run dataset:import -- --source path/to/dataset.zip --name site-safety
npm run dataset:audit -- --data path/to/data.yaml
```

## Training and evaluation

Download a compatible YOLO26 base checkpoint and datasets separately. Dataset archives and working data are intentionally excluded from the repository and release artifacts. After preparing a merged dataset:

```sh
npm run evaluate -- --model outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt \
  --data work/ppe-incremental/data.incremental.yaml --split test
npm run privacy:audit
```

The repository records the current incremental evaluation in `YOLO26_PPE.md`. Treat those metrics as dataset-specific benchmarks, not a general safety certification.

## Privacy and release checks

`npm run privacy:audit` scans every file eligible for desktop/Docker release plus the bundled checkpoint for local user paths, email addresses, private-key markers, and common access-token formats. `npm run build`, `npm run pack:desktop`, `npm run dist:desktop`, and the Dockerfile all run this check before packaging.

Training outputs, raw images, ZIP archives, local logs, `.env`, and nested dataset Git metadata are excluded by `.gitignore`, `.dockerignore`, and the Electron file allowlist. Run the audit after replacing the model or adding release files.

## License

PPE Sentinel is distributed under the GNU Affero General Public License v3.0 or later. Ultralytics is also AGPL-licensed; see `THIRD_PARTY_NOTICES.md` and `LICENSE` before redistributing modified network deployments.

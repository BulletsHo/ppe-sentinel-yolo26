# GitHub Actions 发布配置步骤

本项目已经包含两个工作流：

- `.github/workflows/ci.yml`：在 push 和 Pull Request 时执行隐私审计、Node 语法检查、Python 编译检查和数据集导入测试。
- `.github/workflows/release.yml`：收到 `v*` 标签后，在 Windows 和 Ubuntu Runner 上构建桌面安装包，并创建 GitHub Release。

## 1. 创建 GitHub 仓库

1. 在 GitHub 创建一个空仓库，例如 `ppe-sentinel-yolo26`。
2. 不要在 GitHub 页面自动创建 README、License 或 `.gitignore`，避免第一次推送发生文件冲突。
3. 在源码包根目录执行：

```powershell
git init -b main
git add .
git commit -m "Initial PPE Sentinel YOLO26 release"
git remote add origin https://github.com/BulletsHo/ppe-sentinel-yolo26.git
git push -u origin main
```

如果目录已有 Git 仓库，只需要确认远程地址和默认分支正确，不要重复执行 `git init`。

## 2. 提交前检查

在本地提交前运行：

```powershell
$env:PPE_PYTHON = "C:\path\to\python.exe"
npm.cmd run privacy:audit
npm.cmd run build
npm.cmd test
```

隐私审计会扫描所有桌面/Docker 发布文件和最终 `best.pt`，拒绝本机用户路径、邮箱、私钥标记和常见访问令牌。数据集压缩包、日志、训练目录和 `.env` 不应被强制添加到 Git。

最终模型必须位于：

```text
outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt
```

该文件约 5 MB，低于 GitHub 单文件 100 MB 限制；如果替换为更大的模型，应改用 Git LFS 或 GitHub Release Asset，并同步修改 `package.json`、Dockerfile 和隐私审计范围。

## 3. 检查 GitHub Actions 设置

进入仓库的 `Settings -> Actions -> General`：

1. 允许 GitHub Actions 运行工作流。
2. 在 `Workflow permissions` 选择允许工作流读写仓库内容，或保留默认只读并在需要发布时单独授予 `contents: write`。
3. 对受保护分支设置 Pull Request 检查必须通过。
4. 如果组织限制第三方 Actions，允许 `actions/checkout`、`actions/setup-node`、`actions/setup-python`、`actions/upload-artifact`、`actions/download-artifact` 和 `softprops/action-gh-release`，或将发布步骤替换为组织批准的 Action。

当前工作流使用默认 `GITHUB_TOKEN`，不需要把个人访问令牌写进 Secrets。不要把 `PPE_PASSWORD`、云凭据或 PyPI/GitHub 私钥放入仓库变量。

## 4. CI 工作流执行内容

先在源码包根目录创建工作流目录和配置文件：

```powershell
New-Item -ItemType Directory -Force .github\workflows
New-Item -ItemType File -Force .github\workflows\ci.yml
```

将 `.github/workflows/ci.yml` 写成下面的内容：

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install test dependencies
        run: python -m pip install --disable-pip-version-check "PyYAML>=6,<7"
      - name: Install Node metadata dependencies
        run: npm install --ignore-scripts --no-audit --no-fund
      - name: Run privacy audit and syntax checks
        run: npm run build
      - name: Run dataset importer tests
        run: npm test
```

这里的 `push` 和 `pull_request` 表示所有分支的推送及 Pull Request 都触发检查；`runs-on` 指定 GitHub 托管的 Ubuntu Runner。若只希望检查 `main`，可改为：

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

`.github/workflows/ci.yml` 在 `ubuntu-latest` 上执行：

1. 检出源码。
2. 安装 Node.js 20 和 Python 3.11。
3. 只安装 CI 所需的 `PyYAML`，避免在普通 PR 检查中下载完整 CUDA 环境。
4. 使用 `npm install --ignore-scripts` 读取 Node 依赖，不执行 Electron 二进制下载脚本。
5. 执行 `npm run build`，其中包含 `npm run privacy:audit`、Node 语法检查和 Python 编译检查。
6. 执行 `npm test`，验证 YOLO 数据集导入和 ZIP 路径穿越防护。

Pull Request 页面中的 `CI / checks` 成功后，才建议合并到 `main`。

## 5. 编写桌面发布工作流

在 `.github/workflows/release.yml` 写入：

```yaml
name: Desktop release

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:
    inputs:
      tag:
        description: "Existing release tag (for example, v1.0.2)"
        required: true
        type: string

env:
  RELEASE_TAG: ${{ github.event_name == 'workflow_dispatch' && inputs.tag || github.ref_name }}

permissions:
  contents: write

jobs:
  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.RELEASE_TAG }}
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Validate release version
        run: |
          node -e "const p=require('./package.json'); const tag=process.env.RELEASE_TAG.replace(/^v/, ''); if (p.version !== tag) { console.error('Tag ' + process.env.RELEASE_TAG + ' does not match package version ' + p.version); process.exit(1) }"
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install Python and Node dependencies
        run: |
          python -m pip install --upgrade pip
          python -m pip install -r requirements-build.txt
          npm install --no-audit --no-fund
      - name: Build Windows installers
        run: npm run dist:desktop
      - uses: actions/upload-artifact@v4
        with:
          name: ppe-sentinel-windows
          path: |
            release/*.exe
            release/*.exe.blockmap
          if-no-files-found: error

  linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ env.RELEASE_TAG }}
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install Python and Node dependencies
        run: |
          python -m pip install --upgrade pip
          python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.7.1" "torchvision==0.22.1"
          python -m pip install -r requirements-build.txt
          python -c "import torch, torchvision; assert torch.version.cuda is None, 'Linux desktop build must use CPU-only PyTorch'; print(f'torch={torch.__version__}, torchvision={torchvision.__version__}, cuda={torch.version.cuda}')"
          npm install --no-audit --no-fund
      - name: Build Linux AppImage
        run: npm run dist:desktop
      - name: Verify Linux AppImage size
        shell: bash
        run: |
          set -euo pipefail
          max_bytes=2147483647
          appimage=(release/*.AppImage)
          if [[ ! -f "${appimage[0]}" ]]; then
            echo "No AppImage was generated" >&2
            exit 1
          fi
          for file in "${appimage[@]}"; do
            size=$(stat -c %s "$file")
            echo "$file: $size bytes"
            if (( size > max_bytes )); then
              echo "AppImage exceeds the GitHub Release asset limit of 2147483647 bytes" >&2
              exit 1
            fi
          done
      - uses: actions/upload-artifact@v4
        with:
          name: ppe-sentinel-linux
          path: release/*.AppImage
          if-no-files-found: error

  publish:
    needs: [windows, linux]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: release
          merge-multiple: true
      - name: Verify release asset sizes
        shell: bash
        run: |
          set -euo pipefail
          max_bytes=2147483647
          found=0
          while IFS= read -r -d '' file; do
            found=1
            size=$(stat -c %s "$file")
            echo "$file: $size bytes"
            if (( size > max_bytes )); then
              echo "Release asset exceeds GitHub's 2147483647-byte limit: $file" >&2
              exit 1
            fi
          done < <(find release -maxdepth 1 -type f \( -name '*.exe' -o -name '*.exe.blockmap' -o -name '*.AppImage' \) -print0)
          if (( found == 0 )); then
            echo "No release assets were downloaded" >&2
            exit 1
          fi
      - name: Publish tagged release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ env.RELEASE_TAG }}
          files: |
            release/*.exe
            release/*.exe.blockmap
            release/*.AppImage
          fail_on_unmatched_files: false
          generate_release_notes: true
```

关键配置含义：

- `tags: ["v*"]`：推送 `v` 开头的标签时自动发布，普通代码推送只运行 CI。
- `workflow_dispatch.inputs.tag`：允许从 Actions 页面手动输入已经存在的发布标签。
- `RELEASE_TAG`：自动发布时取 `github.ref_name`，手动发布时取输入值；构建检出与 Release 发布始终使用同一个标签。
- `contents: write`：允许当前工作流使用临时 `GITHUB_TOKEN` 创建 Release；不需要个人访问令牌。
- `requirements-build.txt`：安装 Ultralytics、PyInstaller 等打包后端依赖。
- `npm install`：允许 Electron 安装脚本下载对应平台的运行时；发布构建不能使用 `--ignore-scripts`。
- `electron-builder --publish never`：只生成平台安装包，禁止标签触发 Electron Builder 隐式上传；统一由 Publish Job 发布。
- Linux 发布构建使用 CPU-only PyTorch，避免 CUDA/Triton 动态库使 AppImage 超过 GitHub 单资产 2 GiB 限制；源码部署仍可使用 CUDA。
- 构建与发布前检查每个资产不超过 `2147483647` 字节，并验证标签版本与 `package.json.version` 一致。
- `needs: [windows, linux]`：两个平台均构建成功后才执行发布，避免生成不完整 Release。
- `upload-artifact`/`download-artifact`：先保存平台产物，再汇总给 Publish Job。

## 6. 创建桌面发布版本

合并到 `main` 后，使用符合语义化版本的标签触发发布工作流：

```powershell
git tag -a v1.0.2 -m "PPE Sentinel 1.0.2"
git push origin v1.0.2
```

`release.yml` 的执行顺序如下：

### Windows Job

1. GitHub 为 `windows` Job 分配一台全新的 `windows-latest` 临时 Runner。该 Runner 与其他 Job 不共享磁盘，Job 结束后会被销毁。
2. `actions/checkout@v4` 检出 `RELEASE_TAG` 指向的提交。模型文件 `outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt` 必须已经包含在该提交中。
3. `actions/setup-node@v4` 安装 Node.js 20，并把 `node`、`npm` 加入 `PATH`。Node.js 用于执行隐私审计、本地服务脚本和 Electron Builder。
4. `actions/setup-python@v5` 安装 64 位 Python 3.11，并把 `python`、`pip` 加入 `PATH`。PyInstaller 必须在目标操作系统上运行，因此 Windows 后端只能在 Windows Job 中生成。
5. `python -m pip install --upgrade pip` 更新 pip，随后 `python -m pip install -r requirements-build.txt` 安装 `PyYAML`、`ultralytics==8.4.117` 和 `pyinstaller>=6.16,<7`。Ultralytics 会继续安装 PyTorch、OpenCV 等推理依赖。
6. `npm install --no-audit --no-fund` 安装 `electron` 39.x 和 `electron-builder` 26.x。此处允许执行 npm 安装脚本，以便下载 Windows Electron 运行时；不能改成 CI 中的 `--ignore-scripts`。
7. `npm run dist:desktop` 首先调用 `npm run privacy:audit`。`scripts/audit_release_privacy.py` 扫描将进入发布包的源码和 `best.pt`，若发现本机用户路径、邮箱、私钥标记或常见访问令牌，命令立即失败，后续打包和上传不会执行。
8. 同一命令随后调用 `npm run build:backend`，由 `scripts/build_desktop_backend.py` 依次执行两个 PyInstaller spec。`ppe-inference.spec` 把摄像头推理服务以及 Ultralytics、PyTorch、OpenCV 等依赖冻结为 `dist/backend/ppe-inference.exe`；`ppe-dataset-importer.spec` 把数据集维护工具冻结为 `dist/backend/ppe-dataset-importer.exe`。
9. PyInstaller 使用 `--clean` 清理自身分析缓存，临时构建文件写入 `build/pyinstaller/`。只要任一后端构建返回非零退出码，Python 脚本、`dist:desktop` 和整个 Windows Job 都会失败。
10. 后端成功后，Electron Builder 读取 `package.json` 的 `build` 配置。它收集界面、本地 Node.js 服务、Electron 主进程、Python 脚本、运行要求和最终模型，并通过 `extraResources` 把 `dist/backend` 放入桌面应用的 `resources/backend`。
11. Electron Builder 根据 `win.target` 分别构建 `PPE-Sentinel-Setup-<version>-<arch>.exe` 和 `PPE-Sentinel-Portable-<version>-<arch>.exe`，输出到 `release/`。应用启动时，`electron/main.cjs` 会从 `resources/backend` 查找两个 `.exe` 后端并启动本地服务，因此用户计算机不需要另装 Python。
12. `actions/upload-artifact@v4` 只将 `release/` 顶层的 `.exe` 和 `.exe.blockmap` 保存为 `ppe-sentinel-windows`，不会上传 `win-unpacked`。该上传只在前面所有步骤成功后执行；产物供 Publish Job 使用，并不是最终 GitHub Release 本身。

### Linux Job

1. GitHub 同时为 `linux` Job 分配独立的 `ubuntu-latest` 临时 Runner；只要 Runner 配额允许，它会与 Windows Job 并行执行。
2. `actions/checkout@v4` 检出同一个 `RELEASE_TAG`，确保 Linux 与 Windows 使用完全相同的源码、模型和版本号。
3. `actions/setup-node@v4` 安装 Node.js 20，`actions/setup-python@v5` 安装 Python 3.11。Linux 可执行文件必须在 Linux Runner 上由 PyInstaller 原生生成，不能复用 Windows Job 的 `.exe`。
4. pip 更新后，先从 PyTorch CPU 索引安装 `torch==2.7.1` 和 `torchvision==0.22.1`，再通过 `requirements-build.txt` 安装 PyYAML、Ultralytics、PyInstaller 及其传递依赖；随后 `npm install --no-audit --no-fund` 安装 Linux 对应的 Electron 运行时和 Electron Builder。
5. `npm run dist:desktop` 先执行同一套隐私审计。任何敏感信息命中都会终止 Linux Job，避免把问题文件传到 Actions Artifact 或 GitHub Release。
6. `scripts/build_desktop_backend.py` 在 `dist/backend/` 生成 Linux 原生的 `ppe-inference` 和 `ppe-dataset-importer`，文件名不带 `.exe`。两个 spec 的入口、依赖收集规则和数据集维护能力与 Windows 版本一致。
7. Electron Builder 收集桌面源码、脱敏模型和两个 Linux 后端，通过 `linux.target` 生成 `PPE-Sentinel-<version>-<arch>.AppImage`，结果写入 `release/`。
8. 大小门禁确认 AppImage 不超过 `2147483647` 字节后，`actions/upload-artifact@v4` 只把 `release/` 顶层的 `.AppImage` 保存为 `ppe-sentinel-linux`，不会上传 `linux-unpacked`。如果依赖安装、隐私审计、PyInstaller、Electron Builder 或大小检查任一步失败，该平台产物不会上传，Publish Job 也不会启动。

### Publish Job

1. `needs: [windows, linux]` 让 Publish Job 等待两个平台 Job。只有 Windows 和 Linux 都成功时才发布；任一 Job 失败或被取消，Publish Job 会显示为跳过。
2. GitHub 分配一台新的 `ubuntu-latest` Runner。该 Runner 不执行打包，也看不到前两个 Runner 的本地文件，必须通过 Actions Artifact 取得产物。
3. `actions/download-artifact@v4` 下载当前工作流运行中的全部产物到 `release/`。`merge-multiple: true` 将 Windows 和 Linux Artifact 合并到该目录，便于使用明确的文件扩展名筛选。
4. Publish Job 再次检查所有资产均严格小于 2 GiB；随后 `softprops/action-gh-release@v2` 只查找 `release/*.exe`、`release/*.exe.blockmap` 和 `release/*.AppImage`，并把匹配文件作为 Release Assets 上传。
5. Action 使用显式的 `tag_name: ${{ env.RELEASE_TAG }}` 作为 Release 标签和版本依据，避免手动运行时出现 `GitHub Releases requires a tag`。工作流级 `permissions: contents: write` 允许内置临时 `GITHUB_TOKEN` 创建或更新 Release，不需要配置个人访问令牌。
6. `generate_release_notes: true` 要求 GitHub 根据上一版本标签之后的提交和合并记录自动生成发布说明。仓库提交信息和 Pull Request 标题会直接影响说明质量。
7. 上传全部成功后，GitHub 的 `Releases` 页面才会出现可供用户下载的桌面产物。如果同一标签的工作流被重新运行，Action 会更新该标签对应的现有 Release；应先确认旧资产与新资产不会发生同名冲突。

三个 Job 的状态依赖关系为：

```text
Windows Job ─┐
             ├─ 两者全部成功 ─> Publish Job ─> GitHub Release
Linux Job ───┘
```

## 7. 验证发布产物

在 GitHub 的 `Actions` 页面确认三个 Job 均为绿色，然后在 `Releases` 页面下载：

- Windows `PPE-Sentinel-Setup-<version>-<arch>.exe`：NSIS 安装程序。
- Windows `PPE-Sentinel-Portable-<version>-<arch>.exe`：免安装版本。
- Linux `PPE-Sentinel-<version>-<arch>.AppImage`。

首次启动后检查：

1. 应用能打开主界面并自动启动本地服务器。
2. `/healthz` 返回 `{"status":"ok"}`。
3. `/api/health` 显示 `best.pt` 和 28 个类别。
4. 摄像头设备选择、推理、日志开关和数据集维护面板可用。
5. 在维护面板导入一个小型 YOLO ZIP，确认数据集出现在列表中。
6. 公开部署时确认 HTTPS 和 Basic Auth 正常工作。

## 8. 网络受限时的本地构建

Electron 安装脚本需要访问 npm 和 GitHub Release 资源，PyInstaller/Ultralytics 需要访问 Python 包索引。若本机网络受限，先配置代理或内部镜像，并将缓存放在项目目录：

```powershell
$projectRoot = (Get-Location).Path
$env:npm_config_cache = Join-Path $projectRoot ".npm-cache"
$env:PIP_CACHE_DIR = Join-Path $projectRoot ".pip-cache"
.\scripts\setup.ps1 -BuildTools
npm.cmd run dist:desktop
```

若无法开放网络，使用 GitHub Actions 构建；不要使用 `--ignore-scripts` 进行最终桌面构建，因为 Electron 二进制不会被下载。

## 9. 数据集维护接口不会丢失

桌面和 Web 发布文件明确包含 `app.js`、`server.cjs`、`scripts/import_dataset.py` 以及 PyInstaller 数据集导入后端。发布后仍可使用：

```text
GET  /api/maintenance/datasets
POST /api/maintenance/datasets/import?name=<dataset-name>
```

CLI 也保留：

```sh
npm run dataset:import -- --source path/to/dataset.zip --name site-safety
```

导入只做安全解压、YOLO 标注校验、清单生成和注册，不会自动启动训练。

## 10. 常见失败处理

| 现象 | 处理 |
| --- | --- |
| `npm ... connect EACCES ...:443` | 检查 Runner 网络、代理和 GitHub Release 下载权限；不要只重试 npm。 |
| `EPERM` 写入 npm cache | 设置 `npm_config_cache` 到工作区或 Runner 临时目录。 |
| `PyInstaller is not installed` | 确认执行过 `python -m pip install -r requirements-build.txt`。 |
| `Model not found` | 确认最终 `best.pt` 已提交且路径与 `package.json` 一致。 |
| Release 没有创建 | 检查标签是否以 `v` 开头，以及工作流是否拥有 `contents: write`。 |
| 远程摄像头不可用 | 使用 HTTPS；浏览器禁止普通 HTTP 页面访问远程摄像头。 |

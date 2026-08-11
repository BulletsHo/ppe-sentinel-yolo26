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
git remote add origin https://github.com/<account>/ppe-sentinel-yolo26.git
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

permissions:
  contents: write

jobs:
  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
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
          path: release/*

  linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install Python and Node dependencies
        run: |
          python -m pip install --upgrade pip
          python -m pip install -r requirements-build.txt
          npm install --no-audit --no-fund
      - name: Build Linux AppImage
        run: npm run dist:desktop
      - uses: actions/upload-artifact@v4
        with:
          name: ppe-sentinel-linux
          path: release/*

  publish:
    needs: [windows, linux]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: release
      - name: Publish tagged release
        uses: softprops/action-gh-release@v2
        with:
          files: release/**/*
          generate_release_notes: true
```

关键配置含义：

- `tags: ["v*"]`：只有推送 `v` 开头的标签才发布，普通代码推送只运行 CI。
- `contents: write`：允许当前工作流使用临时 `GITHUB_TOKEN` 创建 Release；不需要个人访问令牌。
- `requirements-build.txt`：安装 Ultralytics、PyInstaller 等打包后端依赖。
- `npm install`：允许 Electron 安装脚本下载对应平台的运行时；发布构建不能使用 `--ignore-scripts`。
- `needs: [windows, linux]`：两个平台均构建成功后才执行发布，避免生成不完整 Release。
- `upload-artifact`/`download-artifact`：先保存平台产物，再汇总给 Publish Job。

## 6. 创建桌面发布版本

合并到 `main` 后，使用符合语义化版本的标签触发发布工作流：

```powershell
git tag -a v1.0.0 -m "PPE Sentinel 1.0.0"
git push origin v1.0.0
```

`release.yml` 的执行顺序如下：

### Windows Job

1. 使用 `windows-latest`。
2. 安装 Node.js 20、Python 3.11、Ultralytics 和 PyInstaller。
3. 执行 `npm install`，下载 Electron 和 electron-builder 所需的 Windows 资源。
4. 执行 `npm run dist:desktop`。
5. 先运行隐私审计，再由 `scripts/build_desktop_backend.py` 生成 `ppe-inference` 和 `ppe-dataset-importer` 两个 PyInstaller 后端。
6. Electron Builder 生成 NSIS 安装包和 Portable 便携版，并上传 `release/*`。

### Linux Job

Linux Job 与 Windows Job 相同，但使用 `ubuntu-latest`，由 Electron Builder 生成 AppImage。

### Publish Job

Windows 和 Linux Job 都成功后，Publish Job 下载两个构建产物，并使用 `softprops/action-gh-release` 为当前 `v*` 标签创建 GitHub Release。发布说明由 `generate_release_notes: true` 自动生成。

## 7. 验证发布产物

在 GitHub 的 `Actions` 页面确认三个 Job 均为绿色，然后在 `Releases` 页面下载：

- Windows `PPE-Sentinel-<version>-<arch>.exe`：NSIS 安装程序。
- Windows 同名 Portable `.exe`：免安装版本。
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

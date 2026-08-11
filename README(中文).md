# PPE Sentinel YOLO26

PPE Sentinel 是一个开源的 YOLO26 工作场所安全检测器，它提供浏览器用户界面、本地 Electron 桌面应用程序、自托管的 HTTP 服务以及受维护的 YOLO 数据集导入接口。

该捆绑的增量模型包含 28 个类别，包括 `Mask`（口罩）、`Gloves`（手套）、`Goggles`（护目镜）、`Safety Vest`（安全背心）、`Coverall`（防护服）和 `Ear Protection`（听力保护耳机）。其中，听力保护耳机（Ear Protection）目前仅有有限的代表性验证数据，因此不得作为合规性决策的唯一依据。

## 克隆与设置

**环境要求**：Node.js 20+、Python 3.10+，以及为所选 PyTorch 版本配置的有效 C/C++ 运行时环境。从本仓库的克隆目录中执行以下操作：

```powershell
git clone https://github.com/BulletsHo/ppe-sentinel-yolo26.git
cd ppe-sentinel-yolo26
.\scripts\setup.ps1
npm start
```

Linux/macOS 系统：

```sh
./scripts/setup.sh
npm start
```

打开 `http://127.0.0.1:4175/`。本地服务器使用位于 `outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt` 的捆绑模型。

---

## 桌面应用程序

Electron 外壳会启动一个隔离的本地服务器，选择一个可用端口，并将摄像头权限限制在该应用程序来源。

```sh
npm install
npm run desktop
```

在安装构建依赖项后构建安装程序：

```sh
npm run dist:desktop
```

构建产物将被写入 `release/` 目录。PyInstaller 会打包推理和数据集导入后端，因此最终用户无需安装 Python。

---

## 公共 HTTPS 部署

请勿在没有身份验证的情况下暴露开发服务器。将 `.env.example` 复制为 `.env`，设置一个长随机字符串作为 `PPE_PASSWORD`，并将 `PPE_DOMAIN` 指向主机的 DNS 记录。Docker Compose 会在 Caddy 后面运行 PPE Sentinel，由 Caddy 负责获取并续期 HTTPS 证书：

```sh
cp .env.example .env
# 编辑 .env：PPE_DOMAIN, PPE_USERNAME, PPE_PASSWORD
docker compose up -d --build
```

远程浏览器访问摄像头需要 HTTPS 支持。对于在应用进程中终止 TLS 的部署环境，直接的 Node 服务器也支持 `PPE_TLS_CERT` 和 `PPE_TLS_KEY` 配置。除非使用了显式配置的、经过身份验证的网关，否则启用 `PPE_PUBLIC=1` 模式时，必须同时提供 `PPE_USERNAME` 和 `PPE_PASSWORD`。

**实用的环境变量：**

| 变量 | 用途 |
| --- | --- |
| `PPE_HOST` / `PORT` | 绑定地址和 Web 端口 |
| `PPE_PUBLIC` | 公共绑定模式；需要基本身份验证 (Basic Auth) |
| `PPE_USERNAME` / `PPE_PASSWORD` | HTTP 基本身份验证凭据 |
| `PPE_MODEL` | 模型检查点 (checkpoint) 路径 |
| `PPE_DEVICE` / `PPE_IMGSZ` | `cpu`、CUDA 设备以及推理尺寸 |
| `PPE_LOG_DIR` | 默认的 JSONL 检测日志目录 |
| `PPE_DATASETS_DIR` | 数据集注册目录 |
| `PPE_INFERENCE_EXECUTABLE` | 覆盖打包的推理后端 |
| `PPE_DATASET_IMPORT_EXECUTABLE` | 覆盖打包的数据集导入器 |

---

## 数据集维护

用户界面的维护面板接受 YOLO 格式的 ZIP 压缩包，能验证标签，阻止 ZIP 路径遍历，创建便携式的 `data.local.yaml`，并记录一个 `dataset-manifest.json`。导入过程绝不会自动开始训练。

相同的接口也可用于自动化操作：

```sh
# 列出导入的数据集
curl http://127.0.0.1:4175/api/maintenance/datasets

# 导入一个 ZIP 压缩包
curl -X POST -H "Content-Type: application/zip" \
  --data-binary @path/to/dataset.zip \
  "http://127.0.0.1:4175/api/maintenance/datasets/import?name=site-safety"
```

命令行界面 (CLI) 仍然可用于维护和持续集成 (CI)：

```sh
npm run dataset:import -- --source path/to/dataset.zip --name site-safety
npm run dataset:audit -- --data path/to/data.yaml
```

---

## 训练与评估

请单独下载兼容的 YOLO26 基础检查点和数据集。数据集压缩包和工作数据被刻意排除在代码仓库和发布产物之外。在准备好合并的数据集后：

```sh
npm run evaluate -- --model outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt \
  --data work/ppe-incremental/data.incremental.yaml --split test
npm run privacy:audit
```

代码仓库将当前的增量评估记录在 `YOLO26_PPE.md` 中。请将这些指标视为特定于数据集的基准测试，而不是通用的安全认证。

---

## 隐私与发布检查

`npm run privacy:audit` 会扫描每个符合桌面/Docker 发布条件的文件，以及用于检查本地用户路径、电子邮件地址、私钥标记和常见访问令牌格式的捆绑检查点。`npm run build`、`npm run pack:desktop`、`npm run dist:desktop` 脚本以及 Dockerfile 在打包之前都会运行此检查。

训练输出、原始图像、ZIP 压缩包、本地日志、`.env` 以及嵌套的数据集 Git 元数据，均会被 `.gitignore`、`.dockerignore` 以及 Electron 文件允许列表排除在外。在替换模型或添加发布文件后，请运行隐私审核。

---

## 许可证

PPE Sentinel 根据 GNU Affero 通用公共许可证 v3.0 或更高版本进行分发。Ultralytics 同样采用 AGPL 许可证；在重新分发修改后的网络部署之前，请参阅 `THIRD_PARTY_NOTICES.md` 和 `LICENSE` 文件。

---

## 本系统训练数据集来源

数据集1：Construction Site Safety Image Dataset Roboflow
https://www.kaggle.com/datasets/snehilsanyal/construction-site-safety-image-dataset-roboflow/data

数据集2：Construction Site SafetyComputer Vision Model
https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety/dataset/30

数据集3：Safety Goggles - PPEComputer Vision Dataset
https://universe.roboflow.com/database-sjrvw/safety-goggles---ppe/dataset/1

数据集4：PPE Dataset for WorkplaceComputer Vision Dataset
https://universe.roboflow.com/siabar/ppe-dataset-for-workplace/dataset/1

数据集5：coverallComputer Vision Dataset
https://universe.roboflow.com/khroos/coverall-cvebt/dataset/2
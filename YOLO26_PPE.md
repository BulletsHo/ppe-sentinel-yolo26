# YOLO26 PPE 训练与测试

## 数据集

- 当前使用：Construction Site Safety v30（YOLO26，CC BY 4.0）
- 数据集页面：https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety/dataset/30
- 项目主页：https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety
- Kaggle 旧版镜像：https://www.kaggle.com/datasets/snehilsanyal/construction-site-safety-image-dataset-roboflow
- 原参考项目：https://github.com/Qunmasj-Vision-Studio/Construction-Site44

已解压数据位于 `work/css-yolo26`，训练配置使用 `work/css-yolo26/data.local.yaml`。

## 环境安装

RTX 5070 建议使用 CUDA 12.8 版 PyTorch：

```powershell
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
python -m pip install ultralytics==8.4.117
```

YOLO26n 官方预训练权重：

https://github.com/ultralytics/assets/releases/download/v8.4.0/yolo26n.pt

下载后放在 `work/yolo26n.pt`。

## 训练

通用命令：

```powershell
python scripts/train_yolo26.py --model work/yolo26n.pt --data work/css-yolo26/data.local.yaml --device 0 --epochs 100 --batch 8
```

最佳权重默认输出到：

`outputs/yolo26-train/ppe-yolo26n/weights/best.pt`

## 测试

必须使用在本数据集上训练后的权重，不能直接把 COCO 预训练权重的指标当作 PPE 指标：

```powershell
python scripts/evaluate_yolo26.py --model outputs/yolo26-train/ppe-yolo26n/weights/best.pt --data work/css-yolo26/data.local.yaml --split test --device 0
```

结果输出到 `outputs/yolo26-eval/test`，包括 `metrics.json`、混淆矩阵和 Ultralytics 验证图。

CUDA 环境与 Ultralytics 分属两个 Python 环境时，可通过环境变量指定解释器，并使用以下参数运行：

```powershell
$env:PPE_PYTHON = "C:\path\to\python.exe"
& $env:PPE_PYTHON scripts\evaluate_yolo26.py `
  --model outputs\yolo26-train\ppe-yolo26n\weights\best.pt `
  --data work\css-yolo26\data.local.yaml --split test --device 0 --workers 0 `
  --project outputs\yolo26-eval --name final-test `
  --ultralytics-site-packages C:\path\to\site-packages
```

本次测试结果：Precision `0.4799`、Recall `0.3082`、mAP50 `0.3081`、mAP50-95 `0.2231`，推理速度 `3.7 ms/image`。完整结果见 `outputs/ppe-yolo26-test-report.md`。

## 输出测试视频

```powershell
& $env:PPE_PYTHON scripts\export_test_video.py `
  --model outputs\yolo26-train\ppe-yolo26n\weights\best.pt `
  --images work\css-yolo26\test\images `
  --output outputs\yolo26-eval\final-test\ppe-test-predictions.mp4 `
  --device 0 --fps 8 --width 1280 --height 720 `
  --ultralytics-site-packages C:\path\to\site-packages
```

视频文件：`outputs/yolo26-eval/final-test/ppe-test-predictions.mp4`。

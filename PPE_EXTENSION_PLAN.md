# PPE 扩展类别说明

当前实时服务优先使用 `outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt`，回退权重才是旧的 25 类模型：

- 已支持：`Mask`（口罩）、`Gloves`（手套）、`Safety Vest`（反光衣）、`Goggles`（护目镜）、`Coverall`（连体防护服）、`Ear Protection`（防噪耳机）。
- `Ear Protection` 目前只有 4 个训练实例且没有独立测试样本，模型类别已接入，但检测精度不足以用于合规判断。

页面的“PPE TARGETS”面板会读取推理服务返回的模型类别名，自动标记“当前模型”或“待训练”。待训练类别不会被界面伪装成已检测类别。

## 增量训练要求

为新增类别准备 YOLO 格式标注，并至少包含以下类别（可按项目需要增加违规负类）：

```text
Goggles
Coverall
Ear Protection
NO-Goggles
NO-Coverall
NO-Ear Protection
```

标注完成后，将新增图像和标签合并到训练集，更新 `data.yaml` 的 `names` 与 `nc`，然后使用现有训练脚本重新训练。生成新的 `best.pt` 后，设置 `PPE_MODEL` 或替换默认权重并重启 `npm run dev`，前端会自动识别新增类别。

数据集来源仍建议使用 Construction Site Safety v30：

https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety/dataset/30

## Incremental training status (2026-08-11)

The 28-class incremental checkpoint is:
`outputs/yolo26-train/ppe-yolo26n-incremental-final/weights/best.pt`

The live service loads this checkpoint automatically when it exists. The
checkpoint names include `Goggles`, `Coverall`, and `Ear Protection`.

Independent test results from the merged test split:

- Overall: precision 0.5556, recall 0.3976, mAP50 0.4109, mAP50-95 0.2868
- Goggles: AP50 0.5477, AP50-95 0.3170 (28 instances)
- Coverall: AP50 0.8299, AP50-95 0.5220 (125 instances)
- Ear Protection: no independent test instances

The extension export contains only four Ear Protection instances, all in the
training split. The training diagnostic AP50 is 0.0, so Ear Protection is
present in the model schema/UI but is not a reliable detector yet. Collect a
separate, representative ear-protection dataset (including negative cases)
before using it for compliance decisions.

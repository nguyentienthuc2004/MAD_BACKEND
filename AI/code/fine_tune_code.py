import torch
import numpy as np
import urllib.request
from PIL import Image
from pathlib import Path
from transformers import ViTForImageClassification, ViTImageProcessor


MODEL_PATH = r"D:\Code\Java\MAD_BE\MAD_BACKEND\AI\checkpoint"


_model = None
_processor = None


def _load():
    global _model, _processor
    if _model is None:
        print(f"Loading model từ: {MODEL_PATH}")
        _processor = ViTImageProcessor.from_pretrained(MODEL_PATH)
        _model = ViTForImageClassification.from_pretrained(MODEL_PATH)
        _model.eval()
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model.to(device)
        print(f"Model ready  (device: {device})\n")
    return _model, _processor


def predict(image_input, threshold: float = 0.5) -> dict:
    try:
        if isinstance(image_input, str) and image_input.startswith("http"):
            tmp = "/tmp/_nsfw_temp.jpg"
            urllib.request.urlretrieve(image_input, tmp)
            pil_img = Image.open(tmp).convert("RGB")

        elif isinstance(image_input, str):
            pil_img = Image.open(image_input).convert("RGB")

        elif isinstance(image_input, np.ndarray):
            pil_img = Image.fromarray(image_input[..., ::-1] if image_input.shape[-1] == 3 else image_input)

        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")

        else:
            raise TypeError(f"Kiểu input không hỗ trợ: {type(image_input)}")

    except Exception as e:
        return {
            "label": "unknown",
            "toxic_score": 0.0,
            "safe_score": 1.0,
            "confidence": "unknown",
            "flagged": False,
            "error": str(e),
        }
    model, processor = _load()
    device = next(model.parameters()).device

    inputs = processor(images=pil_img, return_tensors="pt").to(device)

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=1)[0]
    label2id = model.config.label2id
    nsfw_idx = label2id.get("NSFW", label2id.get("nsfw", 1))
    neutral_idx = label2id.get("Neutral", label2id.get("neutral", 0))

    toxic_score = round(probs[nsfw_idx].item(), 4)
    safe_score = round(probs[neutral_idx].item(), 4)
    label = "toxic" if toxic_score >= threshold else "safe"

    if toxic_score >= 0.85 or toxic_score <= 0.15:
        confidence = "high"
    elif toxic_score >= 0.60 or toxic_score <= 0.40:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "label": label,
        "toxic_score": toxic_score,
        "safe_score": safe_score,
        "confidence": confidence,
        "flagged": label == "toxic",
        "error": None,
    }


if __name__ == "__main__":
    import sys

    test_images = [
        r"D:\Code\Java\MAD_BE\MAD_BACKEND\AI\data\test\Neutral\10563_jpg.rf.22acc9f57eaa3b7344cf22ef85b9a226.jpg",
        r"D:\Code\Java\MAD_BE\MAD_BACKEND\AI\data\test\NSFW\1_w_bloodstains-floor_15_jpg.rf.6de8950d9caf5ec88ae741ad651f9dfb.jpg",
        r"D:\Code\Java\MAD_BE\MAD_BACKEND\AI\data\test\NSFW\3ef0167c56d39d593fd1ad640c8c04e9a6efcabf_full_jpg.rf.ab8fff135917124a54b27cff0adc5e08.jpg",
    ]

    if len(sys.argv) > 1:
        test_images = sys.argv[1:]

    for path in test_images:
        print(f"\n--- {Path(path).name} ---")
        result = predict(path)

        if result["error"]:
            print(f"   ERROR: {result['error']}")
            continue

        icon = "🔴" if result["flagged"] else "🟢"
        bar = "█" * int(result["toxic_score"] * 20) + "░" * (20 - int(result["toxic_score"] * 20))

        print(f"{icon}  label       : {result['label'].upper()}")
        print(f"   toxic score : {result['toxic_score']:.4f}  [{bar}]")
        print(f"   safe score  : {result['safe_score']:.4f}")
        print(f"   confidence  : {result['confidence']}")
        print(f"   flagged     : {result['flagged']}")

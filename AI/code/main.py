import requests
from pathlib import Path


API_USER = "1977122972"  # thay bằng key của bạn
API_SECRET = "JunB5GPXxUUae2BEqgp95WYM8tvHdtLB"  # thay bằng key của bạn

MODELS = "nudity,violence,offensive"


def predict(image_input, threshold: float = 0.5) -> dict:
    try:
        if isinstance(image_input, str) and image_input.startswith("http"):
            response = requests.post(
                "https://api.sightengine.com/1.0/check.json",
                data={
                    "url": image_input,
                    "models": MODELS,
                    "api_user": API_USER,
                    "api_secret": API_SECRET,
                },
            )
        else:
            with open(image_input, "rb") as f:
                response = requests.post(
                    "https://api.sightengine.com/1.0/check.json",
                    files={"media": f},
                    data={
                        "models": MODELS,
                        "api_user": API_USER,
                        "api_secret": API_SECRET,
                    },
                )

        data = response.json()

        if data.get("status") != "success":
            raise ValueError(f"API error: {data.get('error', {}).get('message', 'Unknown error')}")

        nudity_score = _get_nudity_score(data)
        violence_score = round(data.get("violence", {}).get("prob", 0.0), 4)
        offensive_score = round(data.get("offensive", {}).get("prob", 0.0), 4)

        toxic_score = max(nudity_score, violence_score, offensive_score)
        label = "toxic" if toxic_score >= threshold else "safe"

        return {
            "label": label,
            "toxic_score": round(toxic_score, 4),
            "detail": {
                "nudity": nudity_score,
                "violence": violence_score,
                "offensive": offensive_score,
            },
            "flagged": label == "toxic",
            "error": None,
        }

    except Exception as e:
        return {
            "label": "unknown",
            "toxic_score": 0.0,
            "detail": {"nudity": 0.0, "violence": 0.0, "offensive": 0.0},
            "flagged": False,
            "error": str(e),
        }


def _get_nudity_score(data: dict) -> float:
    """Lấy nudity score cao nhất từ response."""
    nudity = data.get("nudity", {})
    return round(
        max(
            nudity.get("sexual_activity", 0.0),
            nudity.get("sexual_display", 0.0),
            nudity.get("erotica", 0.0),
        ),
        4,
    )


if __name__ == "__main__":
    import sys

    test_images = [
        r"D:\Code\Java\MAD_BE\MAD_BACKEND\AI\data\test\Neutral\10563_jpg.rf.22acc9f57eaa3b7344cf22ef85b9a226.jpg",
        r"D:\Code\Java\MAD_BE\MAD_BACKEND\AI\data\test\NSFW\0_w_bloodstains-floor_6_jpg.rf.ee8ca878f0685db85c688cdfb2275809.jpg",
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
        print(f"   nudity      : {result['detail']['nudity']:.4f}")
        print(f"   violence    : {result['detail']['violence']:.4f}")
        print(f"   offensive   : {result['detail']['offensive']:.4f}")
        print(f"   flagged     : {result['flagged']}")

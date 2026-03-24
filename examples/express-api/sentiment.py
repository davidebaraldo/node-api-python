"""Simple sentiment analysis module.

In a real app, you'd use a trained model here (scikit-learn, transformers, etc.).
This example uses a keyword-based approach to keep dependencies minimal.
"""

POSITIVE_WORDS = {"love", "great", "amazing", "excellent", "good", "happy", "wonderful", "fantastic", "best", "awesome"}
NEGATIVE_WORDS = {"hate", "bad", "terrible", "awful", "worst", "horrible", "disgusting", "poor", "ugly", "boring"}


def analyze(text: str) -> dict[str, float | str]:
    """Analyze sentiment of input text.

    Returns a dict with:
      - score: float from -1.0 (negative) to 1.0 (positive)
      - label: "positive", "negative", or "neutral"
      - confidence: float from 0.0 to 1.0
    """
    words = set(text.lower().split())
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    total = pos + neg

    if total == 0:
        return {"score": 0.0, "label": "neutral", "confidence": 0.0}

    score = (pos - neg) / total
    confidence = total / len(words) if words else 0.0

    if score > 0.1:
        label = "positive"
    elif score < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return {"score": round(score, 3), "label": label, "confidence": round(min(confidence, 1.0), 3)}


def batch_analyze(texts: list[str]) -> list[dict[str, float | str]]:
    """Analyze sentiment of multiple texts."""
    return [analyze(t) for t in texts]

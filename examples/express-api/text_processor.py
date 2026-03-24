"""Text processing utilities for the Express API example."""

_call_count = 0


def summarize(text: str, max_length: int = 100) -> str:
    """Simple extractive summary — returns the first N characters at a sentence boundary."""
    global _call_count
    _call_count += 1

    if len(text) <= max_length:
        return text

    # Find the last sentence boundary before max_length
    truncated = text[:max_length]
    last_period = truncated.rfind(".")
    if last_period > 0:
        return truncated[: last_period + 1]
    return truncated.rstrip() + "..."


def get_stats() -> dict[str, int]:
    """Return usage statistics."""
    return {"total_calls": _call_count}

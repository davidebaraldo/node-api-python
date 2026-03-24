"""CLI tools — Python utilities exposed as sync calls for a Node.js CLI.

These functions are designed for synchronous use in a CLI context.
No external dependencies required — uses only the Python standard library.
"""

from __future__ import annotations
import hashlib
import uuid
import json
from collections import Counter


def hash_text(text: str) -> dict[str, str]:
    """Compute MD5 and SHA256 hashes of a string."""
    return {
        "md5": hashlib.md5(text.encode()).hexdigest(),
        "sha256": hashlib.sha256(text.encode()).hexdigest(),
    }


def analyze_file(file_path: str) -> dict[str, int | list[tuple[str, int]]]:
    """Analyze a text file: count lines, words, characters, and find top words."""
    with open(file_path, encoding="utf-8") as f:
        content = f.read()

    lines = content.count("\n") + (1 if content and not content.endswith("\n") else 0)
    words = content.split()
    word_freq = Counter(w.lower().strip(".,!?;:'\"()[]{}") for w in words)
    top_words = word_freq.most_common(5)

    return {
        "lines": lines,
        "words": len(words),
        "characters": len(content),
        "top_words": top_words,
    }


def generate_uuids(count: int = 1) -> list[str]:
    """Generate a list of UUIDs."""
    return [str(uuid.uuid4()) for _ in range(count)]


def json_to_yaml(json_string: str) -> str:
    """Convert a JSON string to YAML format (simple implementation, no PyYAML needed)."""
    data = json.loads(json_string)
    return _to_yaml(data, indent=0)


def _to_yaml(obj: object, indent: int = 0) -> str:
    """Recursively convert a Python object to YAML string."""
    prefix = "  " * indent
    if isinstance(obj, dict):
        if not obj:
            return "{}"
        lines = []
        for key, value in obj.items():
            if isinstance(value, (dict, list)):
                lines.append(f"{prefix}{key}:")
                lines.append(_to_yaml(value, indent + 1))
            else:
                lines.append(f"{prefix}{key}: {_format_yaml_value(value)}")
        return "\n".join(lines)
    elif isinstance(obj, list):
        if not obj:
            return f"{prefix}[]"
        lines = []
        for item in obj:
            if isinstance(item, (dict, list)):
                lines.append(f"{prefix}-")
                lines.append(_to_yaml(item, indent + 1))
            else:
                lines.append(f"{prefix}- {_format_yaml_value(item)}")
        return "\n".join(lines)
    else:
        return f"{prefix}{_format_yaml_value(obj)}"


def _format_yaml_value(value: object) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str):
        return f'"{value}"' if any(c in value for c in ":#{}[]&*!|>'\"%@`") else value
    return str(value)

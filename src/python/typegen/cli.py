"""CLI for type generation. Called from Node.js."""
import sys
from pathlib import Path

from .emitter import emit_dts
from .extractor import extract_module


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m typegen <file.py>", file=sys.stderr)
        sys.exit(1)

    file_path = Path(sys.argv[1])
    if not file_path.exists():
        print(f"Error: file not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    source = file_path.read_text(encoding="utf-8")
    module_name = file_path.stem

    module_info = extract_module(source, module_name)
    dts_content = emit_dts(module_info)

    # Output to stdout for the Node.js script to capture
    print(dts_content)


if __name__ == "__main__":
    main()

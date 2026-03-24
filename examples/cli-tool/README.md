# Example: CLI Tool

A Node.js CLI that uses Python for core logic. All calls are synchronous — no async/await needed.

## Run

```bash
node examples/cli-tool/cli.js hash "hello world"
node examples/cli-tool/cli.js analyze README.md
node examples/cli-tool/cli.js uuid 5
node examples/cli-tool/cli.js json-to-yaml '{"name": "test", "value": 42}'
```

## What this shows

- Sync Python calls — perfect for CLI tools (no async boilerplate)
- Python standard library available (hashlib, uuid, json, collections)
- No external Python dependencies needed
- Clean argument parsing in Node.js, heavy lifting in Python

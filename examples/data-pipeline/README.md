# Example: Data Pipeline

Process structured data with Python (pandas/numpy) from Node.js.

## Run

```bash
# Optional: install pandas/numpy for full features (works without them too)
pip install pandas numpy

node examples/data-pipeline/main.js
```

## What this shows

- Sending JavaScript objects/arrays to Python for processing
- Getting structured results back (dicts → objects)
- Using pandas DataFrames from Node.js
- Zero-copy potential with TypedArray → numpy
- Graceful fallback when pandas/numpy aren't installed

# Example: Express API with Python Backend

An Express.js server that uses Python for sentiment analysis and text processing.

## Run

```bash
npm install express
node examples/express-api/server.js
```

## Test

```bash
# Sentiment analysis
curl http://localhost:3000/predict \
  -X POST -H "Content-Type: application/json" \
  -d '{"text": "I love this amazing product!"}'
# → {"score":1.0,"label":"positive","confidence":0.4}

# Text summarization
curl http://localhost:3000/summarize \
  -X POST -H "Content-Type: application/json" \
  -d '{"text": "Long article text goes here...", "max_length": 50}'
# → {"summary":"Long article text goes here..."}

# Usage stats (sync call)
curl http://localhost:3000/stats
# → {"total_calls":2}
```

## What this shows

- Loading Python modules at server startup
- Async Python calls inside Express route handlers
- Sync Python calls for quick operations
- Error handling across the JS/Python boundary

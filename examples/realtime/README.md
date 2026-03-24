# Example: Realtime

Bidirectional communication between Node.js and Python.

## Run

```bash
node examples/realtime/main.js
```

## What this shows

- **Progress callbacks**: Python reports progress to a JavaScript function
- **Event emitter**: Python emits typed events, JavaScript listens
- **Streaming**: Python generator becomes a JavaScript async iterator
- All communication happens in-process, zero IPC overhead

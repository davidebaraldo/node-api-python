# node-api-python

[![CI](https://github.com/davidebaraldo/node-api-python/actions/workflows/ci.yml/badge.svg)](https://github.com/davidebaraldo/node-api-python/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/node-api-python.svg)](https://www.npmjs.com/package/node-api-python)
[![npm downloads](https://img.shields.io/npm/dm/node-api-python.svg)](https://www.npmjs.com/package/node-api-python)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10--3.14-3776AB?logo=python&logoColor=white)](https://python.org)

**High-performance Node.js ↔ Python bridge via embedded CPython.**

Call Python from JavaScript with zero IPC overhead. Types are converted automatically. NumPy arrays are shared without copying. TypeScript definitions are generated from Python type hints.

```bash
npm install node-api-python
```

---

## Table of Contents

- [Why?](#why)
- [Install](#install)
- [Quick Start](#quick-start)
- [Project Templates](#project-templates)
- [Examples](#examples)
- [CLI Commands](#cli-commands)
- [Setup by Platform](#setup-by-platform)
- [Using with Virtual Environments](#using-with-virtual-environments)
- [Requirements](#requirements)
- [API Reference](#api-reference)
- [Development](#development)
- [Documentation](#documentation)

---

## Why?

Existing bridges (pythonia, child_process) spawn a separate Python process and communicate over IPC. This adds latency, forces everything to be async, and loses type information.

**node-api-python** embeds CPython directly inside Node.js via a native addon. Python runs in the same process — function calls are just function calls.

| | node-api-python | pythonia | subprocess |
|---|---|---|---|
| Architecture | In-process | IPC | Process spawn |
| Sync API | Yes | No | No |
| Type generation | Yes | No | No |
| Callbacks Py→JS | Yes | Limited | No |
| Zero-copy arrays | Yes | No | No |

---

## Install

```bash
npm install node-api-python
```

On supported platforms (Windows/macOS/Linux, x64/arm64), **prebuilt binaries are included** — no compiler or build tools needed.

If no prebuild is available for your platform, the addon compiles from source automatically. Run the doctor to check your setup:

```bash
npx node-api-python doctor
```

---

## Quick Start

### Create a new project (recommended)

```bash
npx node-api-python init my-project
cd my-project
npm install
npm start
```

This scaffolds a ready-to-use project. Just add your `.py` files in the `python/` folder.

### Add to an existing project

```bash
npm install node-api-python
```

```js
const python = require('node-api-python')

// Import a Python module
const mod = python.import('./my_module')

// Sync — for scripts, CLIs, quick tasks
const result = mod.addSync(2, 3)

// Async — non-blocking, for servers
const prediction = await mod.predict(data)

// Zero-copy NumPy interop
const arr = new Float64Array([1.0, 2.0, 3.0])
const sum = mod.computeSync(arr)
```

### Auto-generate TypeScript types

```bash
npx node-api-python generate-types ./my_module.py -o ./types/
```

```python
# my_module.py
def compute(x: int, y: float) -> dict[str, float]:
    """Compute weighted values."""
    ...
```

```typescript
// types/my_module.d.ts (auto-generated)
/** Compute weighted values. */
export function compute(x: number, y: number): Record<string, number>
```

---

## Project Templates

Start with a pre-configured template for your use case:

```bash
npx node-api-python init my-project --template <name>
```

| Template | Command | What you get |
|---|---|---|
| **basic** (default) | `npx node-api-python init my-app` | Math + text Python modules, sync/async calls |
| **express** | `npx node-api-python init my-api --template express` | Express server with Python sentiment analysis backend |
| **data** | `npx node-api-python init my-pipeline --template data` | pandas/numpy data processing from Node.js |
| **cli** | `npx node-api-python init my-tool --template cli` | CLI tool with sync Python calls (hash, uuid, file analysis) |
| **fullstack** | `npx node-api-python init my-app --template fullstack` | TypeScript + Python with auto-generated `.d.ts` types |
| **fastapi** | `npx node-api-python init my-api --template fastapi` | FastAPI server + direct in-process calls from Node.js |
| **ml** | `npx node-api-python init my-ml --template ml` | ML inference with scikit-learn, train & predict from Node.js |

Every template includes:
- Working code that runs immediately with `npm start`
- Python modules with full type hints
- `npm run types` to auto-generate TypeScript definitions
- `npm run doctor` to check your environment
- README with instructions

List all templates:

```bash
npx node-api-python init --list
```

---

## Examples

The `examples/` folder contains complete, runnable examples for every major feature.

### Basic — Simple function calls

```bash
node examples/basic/main.js
```

```js
const python = require('node-api-python')
const math = python.import('./examples/basic/math_utils')

console.log(math.addSync(2, 3))          // 5
console.log(math.multiplySync(2.5, 4))   // 10.0
console.log(math.greetSync('World'))     // "Hello, World!"
```

### Express API — Python ML backend

```bash
npm install express
node examples/express-api/server.js
```

```bash
# Test
curl http://localhost:3000/predict \
  -X POST -H "Content-Type: application/json" \
  -d '{"text": "I love this amazing product!"}'
# → {"score":1.0,"label":"positive","confidence":0.4}
```

Python handles the ML logic, Express handles routing and HTTP.

### Data Pipeline — pandas/numpy from Node.js

```bash
pip install pandas numpy    # optional, works without them too
node examples/data-pipeline/main.js
```

```js
const pipeline = python.import('./examples/data-pipeline/pipeline')

const salesData = [
  { date: '2025-01-15', product: 'Widget A', quantity: 150, price: 29.99 },
  // ...
]
const summary = await pipeline.summarize_sales(salesData)
// → { total_revenue: 25467.0, by_product: {...}, top_product: "Widget A" }
```

### Realtime — Callbacks and events

```bash
node examples/realtime/main.js
```

```js
const processor = python.import('./examples/realtime/processor')

// Progress callback — Python calls your JS function
await processor.long_task(100, (progress, msg) => {
  console.log(`${progress}% — ${msg}`)
})

// Event emitter — Python emits, JS listens
const monitor = processor.create_monitor()
monitor.on('cpu', (value) => console.log(`CPU: ${value}%`))
monitor.on('alert', (msg) => console.log(`ALERT: ${msg}`))
await monitor.start(5)

// Streaming — Python generator → JS async iterator
for await (const chunk of processor.stream_results(10)) {
  console.log(chunk)
}
```

### Fullstack TypeScript — Auto-generated types

```bash
npm install tsx
npx tsx examples/fullstack/server.ts
```

```python
# Python: type hints
class UserEvent(TypedDict):
    user_id: str
    action: str
    page: str
    timestamp: float

def generate_report(events: list[UserEvent]) -> AnalyticsReport: ...
```

```typescript
// Auto-generated TypeScript
interface UserEvent {
  user_id: string
  action: string
  page: string
  timestamp: number
}
function generate_report(events: UserEvent[]): Promise<AnalyticsReport>
```

Full IDE autocomplete and type checking across the JS/Python boundary.

### CLI Tool — Sync Python calls

```bash
node examples/cli-tool/cli.js hash "hello world"
node examples/cli-tool/cli.js uuid 5
node examples/cli-tool/cli.js analyze README.md
node examples/cli-tool/cli.js json-to-yaml '{"name":"test","value":42}'
```

All calls are synchronous — no async boilerplate. Uses only the Python standard library.

---

## CLI Commands

```bash
npx node-api-python init [name] [--template <t>]  # Scaffold a new project
npx node-api-python init                           # Interactive mode — choose template
npx node-api-python doctor                         # Check your environment
npx node-api-python find-python                    # Show detected Python
npx node-api-python generate-types <file> [-o dir] # Generate .d.ts from type hints
```

---

## Requirements

| Dependency | Version | Notes |
|---|---|---|
| **Node.js** | 22, 24, or 25 | |
| **Python** | 3.10 — 3.14 | Required at runtime |
| **numpy** | latest | Optional, for zero-copy arrays |

Prebuilt binaries are included for **Windows x64**, **macOS arm64**, and **Linux x64**.
If a prebuild is available for your platform, `npm install` just works — no compiler or CMake needed.

```bash
npx node-api-python doctor   # verify your environment
```

---

## Building from Source

If no prebuild is available for your platform (or you want to compile yourself), you also need:

| Dependency | Version | Notes |
|---|---|---|
| **CMake** | 3.15+ | |
| **C++ compiler** | C++17 | MSVC on Windows, GCC or Clang on Unix |
| **pybind11** | latest | `pip install pybind11` |

Python **dev headers** are required when building from source (`python3-dev` on Debian/Ubuntu, `python3-devel` on Fedora/RHEL). On Windows and macOS they are included with standard Python installers.

### Windows

```powershell
winget install Python.Python.3.13
winget install Kitware.CMake
pip install pybind11 numpy
```

> **Note:** Build from a **Developer Command Prompt** or **Developer PowerShell** (for MSVC access).

### macOS

```bash
brew install python@3.13 cmake
pip3 install pybind11 numpy
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install python3 python3-dev python3-pip cmake build-essential
pip3 install pybind11 numpy
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install python3 python3-devel python3-pip cmake gcc-c++
pip3 install pybind11 numpy
```

---

## Using with Virtual Environments

node-api-python auto-detects active virtualenvs and conda environments.

```bash
# Virtualenv
python3 -m venv .venv
source .venv/bin/activate      # Linux/macOS
# .venv\Scripts\activate       # Windows
pip install pybind11 numpy

# Conda
conda activate myenv
pip install pybind11 numpy
```

To use a specific Python installation, set:

```bash
export NODE_API_PYTHON_PATH=/path/to/python3
```

---

## API Reference

### `python.import(modulePath, options?)`

Import a Python module. Returns a proxy object with all module functions.

```js
const mod = python.import('./my_module')     // relative path
const np = python.import('numpy')            // installed package
```

**Options:**
- `pythonPath` — path to Python executable (auto-detected if not set)
- `paths` — additional paths to add to Python's `sys.path`

### Calling functions

Every Python function is available in two forms:

```js
// Async (default) — returns a Promise, doesn't block the event loop
const result = await mod.my_function(arg1, arg2)

// Sync — blocks until complete, great for scripts and CLIs
const result = mod.my_functionSync(arg1, arg2)
```

### Type conversion

Types are converted automatically:

| JavaScript | Python |
|---|---|
| `number` | `int` / `float` |
| `string` | `str` |
| `boolean` | `bool` |
| `null` / `undefined` | `None` |
| `Array` | `list` |
| `Object` | `dict` |
| `BigInt` | `int` |
| `Date` | `datetime` |
| `Buffer` | `bytes` |
| `Float64Array` | `numpy.ndarray` (zero-copy) |

### Callbacks

Pass JavaScript functions to Python:

```js
mod.process(data, (progress) => {
  console.log(`${progress}%`)
})
```

### Events

```js
const obj = mod.create_monitor()
obj.on('event_name', (data) => { ... })
```

### Generators / Streaming

Python generators become async iterators:

```js
for await (const item of mod.stream_data()) {
  console.log(item)
}
```

---

## Development

```bash
git clone https://github.com/davidebaraldo/node-api-python.git
cd node-api-python

# Check environment
npx node-api-python doctor

# Install dependencies
npm install

# Build native addon + TypeScript
npm run build

# Run tests
npm test

# Run a specific example
node examples/basic/main.js
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contributor guidelines.

---

## Documentation

- [Roadmap](ROADMAP.md) — project phases and progress
- [Contributing](CONTRIBUTING.md) — how to contribute
- [Changelog](CHANGELOG.md) — version history
- [Security](SECURITY.md) — vulnerability reporting
- [npm package](https://www.npmjs.com/package/node-api-python)

## License

[MIT](LICENSE) — Copyright (c) 2026 Davide Baraldo

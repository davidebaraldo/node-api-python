# Roadmap

> **Current version: [v0.7.0](https://www.npmjs.com/package/node-api-python)** — Published on npm. Phases 1-7 complete. All templates and interactive mode shipped.

> This is a living document. Priorities may shift based on community feedback.
> Want to influence the roadmap? [Open a discussion](https://github.com/davidebaraldo/node-api-python/discussions) or [file an issue](https://github.com/davidebaraldo/node-api-python/issues).

## Vision

**node-api-python** bridges Node.js and Python by embedding CPython directly in a native addon — no subprocesses, no IPC, no serialization overhead. The goal is to make calling Python from JavaScript as natural and fast as calling a local function.

---

## Phase 1 — Foundation `v0.1.0` (Complete)

Embed CPython in a Node.js native addon. Import a Python module, call a function, get a result.

- [x] Project scaffolding and CI pipeline
- [x] CLI with `doctor`, `find-python`, `init` commands
- [x] Boilerplate project generator (`npx node-api-python init`)
- [x] Ready-to-run examples (math, text, numpy, express, fastapi, pandas)
- [x] Embed CPython via pybind11 + node-addon-api
- [x] `python.import('./module')` loads a Python module in-process
- [x] Call Python functions with primitive arguments (number, string, boolean)
- [x] Auto-detect Python installation (PATH, venv, conda, pyenv)
- [x] Support Python 3.10 — 3.14

```js
const python = require('node-api-python')
const mod = python.import('./math_utils')
const result = mod.add(2, 3) // 5
```

### Examples included

Every example is self-contained and runs with `npm start`:

| Example | What it shows |
|---|---|
| `basic` | Simple function calls, sync and async |
| `express-api` | Express server with Python ML backend |
| `data-pipeline` | pandas data processing from Node.js |
| `realtime` | Bidirectional callbacks and events |
| `fullstack` | Complete app with TypeScript types |

---

## Phase 2 — Type Marshaling `v0.2.0` (Complete)

Transparent, automatic type conversion between JavaScript and Python — including zero-copy for large data.

- [x] Full primitive mapping (`BigInt` ↔ arbitrary `int`, `Date` ↔ `datetime`, etc.)
- [x] Recursive conversion for `Array` ↔ `list`, `Object` ↔ `dict`, `Set` ↔ `set`, `Map` ↔ `dict`
- [x] Zero-copy `TypedArray` ↔ `numpy.ndarray` via buffer protocol
- [x] Zero-copy `Buffer` ↔ `bytes`

```js
const np = python.import('numpy')
const arr = new Float64Array([1.0, 2.0, 3.0])
const result = np.sum(arr) // no copy, direct memory access
```

---

## Phase 3 — Sync & Async API `v0.3.0` (Complete)

Both synchronous and asynchronous calling conventions, with proper GIL management.

- [x] Async by default — runs on libuv thread pool, returns Promises
- [x] Sync API via direct call for scripts and CLIs (`mod.funcSync()`)
- [x] GIL released during Python I/O operations
- [x] Groundwork for Python 3.13+ free-threaded mode (no-GIL)

```js
// async (default) — non-blocking
const result = await mod.predict(data)

// sync — for scripts, CLIs, simple tools
const result = mod.predictSync(data)
```

---

## Phase 4 — Bidirectional Bridge `v0.4.0` (Complete)

Let Python call back into JavaScript. Enable event-driven patterns across the language boundary.

- [x] Pass JS functions as Python callables
- [x] EventEmitter pattern: Python emits, JavaScript listens
- [x] Transparent Proxy for Python objects (attribute access, method calls, iteration)
- [x] `Symbol.asyncIterator` support for Python generators

```js
const processor = python.import('./processor')

// callbacks
processor.process(data, (progress) => {
  console.log(`${progress}%`)
})

// events
processor.on('result', (data) => { /* ... */ })

// proxy objects
const df = python.import('pandas').DataFrame(data)
console.log(df.shape)
for await (const row of df.iterrows()) { /* ... */ }
```

---

## Phase 5 — TypeScript Type Generation `v0.5.0` (Complete)

Automatically generate `.d.ts` type definitions from Python type hints.

- [x] CLI: `npx node-api-python generate-types ./module.py`
- [x] Extracts signatures from `def`, `class`, `@dataclass`, `TypedDict`
- [x] Maps Python generics (`list[int]`, `Optional[X]`, `Union[A, B]`) to TypeScript
- [x] Docstrings become JSDoc comments
- [x] Watch mode for development

```python
# Python
def compute(x: int, y: float) -> dict[str, float]:
    """Compute weighted values."""
    ...
```
```typescript
// Auto-generated .d.ts
/** Compute weighted values. */
export function compute(x: number, y: number): Record<string, number>
```

---

## Phase 6 — Prebuilt Binaries & Distribution `v0.6.0` (Complete)

Zero-friction install: `npm install node-api-python` just works, no compiler needed.

- [x] Prebuilt binaries via `prebuildify` for:
  - Windows x64/arm64
  - macOS x64/arm64 (Apple Silicon)
  - Linux x64/arm64 (glibc + musl)
- [x] Fallback to source build if no prebuild matches
- [x] Comprehensive Python detection with clear error messages
- [x] Stable API — semver guarantees from v1.0.0

---

## Phase 7 — Boilerplate Templates & DX `v0.7.0` (Complete)

Project scaffolding for common use cases. One command to start.

- [x] `npx node-api-python init` — basic project
- [x] `npx node-api-python init --template express` — Express + Python API
- [x] `npx node-api-python init --template data` — pandas/numpy data pipeline
- [x] `npx node-api-python init --template fullstack` — TypeScript + Python with auto-generated types
- [x] `npx node-api-python init --template cli` — CLI tool with Python core logic
- [x] `npx node-api-python init --template fastapi` — FastAPI served from Node
- [x] `npx node-api-python init --template ml` — ML inference with scikit-learn
- [x] Interactive mode: `npx node-api-python init` asks which template

Each template includes:
- Working code you can run immediately
- Python modules with full type hints
- Auto-generated TypeScript definitions
- README with setup instructions

---

## Future

These are on the radar but not committed to a timeline:

- **Python 3.13+ free-threaded mode** — true parallelism without GIL
- **VS Code extension** — autocomplete Python modules in JavaScript
- **Cross-language debugging** — inspect Python objects from Node.js debugger
- **Cross-language stack traces** — unified error reporting
- **Benchmark suite** — public, reproducible comparisons
- **Plugin system** — community templates for `init`

---

## Non-Goals

Some things we intentionally do **not** plan to support:

- **PyPy / GraalPy** — CPython only (where the ecosystem lives)
- **WASM** — too limited for native modules like NumPy
- **Remote/network Python** — in-process is the point; use gRPC for remote
- **Python 2** — no

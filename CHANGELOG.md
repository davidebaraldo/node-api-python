# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-03-28

### Added
- FastAPI template: `npx node-api-python init --template fastapi` — FastAPI server with direct in-process calls from Node.js
- ML template: `npx node-api-python init --template ml` — scikit-learn inference (train + predict) from Node.js
- Interactive mode: `npx node-api-python init` without arguments prompts for project name and template

### Changed
- Excluded Python `__pycache__` bytecode from npm package (38kB vs 48kB)
- Added `.editorconfig` for cross-editor consistency
- Updated README with npm badges, downloads counter, and install command

## [0.6.0] - 2026-03-27

### Added
- Prebuilt binaries for Windows/macOS/Linux (x64 and arm64)
- Automatic prebuild detection in postinstall — no compiler needed for users
- Fallback to source build when no prebuild available
- Platform targeting in package.json (os + cpu fields)
- npm pack includes only what consumers need

## [0.5.0] - 2026-03-27

### Added
- TypeScript type generation CLI: `npx node-api-python generate-types`
- Extracts type hints from Python `def`, `class`, `@dataclass`, `TypedDict`
- Maps Python generics (`list[int]`, `Optional[X]`, `Union[A, B]`) to TypeScript
- Docstrings become JSDoc comments in generated `.d.ts`
- Watch mode: `--watch` flag for development
- Generates both async and sync function signatures
- End-to-end tested: Python source → `.d.ts` output

## [0.4.0] - 2026-03-26

### Added
- Bidirectional bridge: pass JS functions as Python callables
- EventEmitter pattern: Python emits events, JavaScript listens
- Transparent Proxy for Python objects (attribute access, method calls)
- `Symbol.asyncIterator` support for Python generators
- Comprehensive callback and event tests

## [0.3.0] - 2026-03-26

### Added
- Async API: Python calls run on libuv thread pool, return Promises
- Sync API: direct calls for scripts and CLIs (`mod.funcSync()`)
- GIL management: acquire/release per call
- Groundwork for Python 3.13+ free-threaded mode
- Sync/async tests with concurrency validation

## [0.2.0] - 2026-03-26

### Added
- Full type marshaling: number, string, boolean, null, BigInt, Array, Object, Set, Map, Date, Buffer
- Recursive conversion for nested structures
- Zero-copy TypedArray ↔ numpy.ndarray via buffer protocol
- Zero-copy Buffer ↔ bytes
- Type roundtrip tests for all supported types

## [0.1.0] - 2026-03-26

### Added
- Embedded CPython via pybind11 + node-addon-api
- `python.import()` loads Python modules in-process
- Auto-detect Python installation (PATH, venv, conda, pyenv)
- Support for Python 3.10 — 3.14
- CLI: `doctor`, `find-python`, `init`, `generate-types`
- Project templates: basic, express, data, cli, fullstack
- 5 runnable examples (basic, express-api, data-pipeline, realtime, fullstack, cli-tool)
- CI pipeline with matrix build (3 OS × 3 Node × 5 Python)
- Release pipeline with prebuilt binaries and npm publish

## [0.0.1] - 2026-03-26

### Added
- Initial project scaffolding

[Unreleased]: https://github.com/davidebaraldo/node-api-python/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/davidebaraldo/node-api-python/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/davidebaraldo/node-api-python/releases/tag/v0.0.1

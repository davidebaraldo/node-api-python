# Changelog

## [v0.10.0] - 2026-03-29

## What's New

### Test Coverage Hardening (Phase 10)

Comprehensive edge case test suite with **44 new tests** across 11 categories:

| Category | Tests | What's covered |
|---|---|---|
| **BigInt** | 7 | MAX_SAFE_INTEGER boundary, 2^128 multi-word, negative BigInt |
| **Deep nesting** | 4 | 50-level dicts, 20-level lists, mixed dict/list |
| **Special floats** | 4 | NaN, Infinity, -Infinity, -0.0 |
| **Mixed collections** | 3 | Mixed-type lists, None values, interspersed nulls |
| **Error propagation** | 7 | RuntimeError, KeyError, AttributeError, RecursionError, nested stacks, unicode messages, async errors |
| **Import errors** | 3 | Syntax errors, import errors, missing modules |
| **String edge cases** | 3 | Empty, null bytes, 1MB strings |
| **Bytes edge cases** | 3 | All 256 byte values, empty, 1MB |
| **Datetime** | 3 | Microsecond precision, epoch, far-future (2999) |
| **Module state** | 2 | Global persistence, shared state on re-import |
| **Stress tests** | 5 | 10K sync, 500 concurrent async, sync/async interleaving, memory leak detection |

### Coverage tooling

- `npm run test:coverage` — run tests with V8 coverage reporting
- `@vitest/coverage-v8` integrated into vitest config
- Edge cases test added to CI matrix on all platforms

## [v0.9.0] - 2026-03-29

## What's Changed

### Features
- feat: cross-language stack traces with structured Python error info (v0.9.0)
- feat: add benchmark suite with CI publishing and updated roadmap

### Other
- docs: add benchmarks section to README
- docs: clarify setup requirements — separate runtime vs build-from-source (#1)



## [v0.7.0] - 2026-03-28

## What's Changed

### Features
- feat: add fastapi/ml templates and interactive init mode

### Other
- docs: update README badges and ROADMAP for npm release
- chore: prepare for open-source release
- ci: switch npm publish to OIDC trusted publishing




window.BENCHMARK_DATA = {
  "lastUpdate": 1774776549780,
  "repoUrl": "https://github.com/davidebaraldo/node-api-python",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "baraldodavide@gmail.com",
            "name": "Davide Baraldo",
            "username": "davidebaraldo"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b9367b96ceb448fbf8e342c48ebeed9a040f1050",
          "message": "feat: add benchmark suite with CI publishing and updated roadmap\n\n* feat: add benchmark suite and CI workflow, update roadmap to v0.8.0\n\nAdd reproducible benchmark suite covering call overhead, type marshaling,\nNumPy zero-copy, callbacks, and async concurrency. Results are published\nto GitHub Pages and commented on PRs via github-action-benchmark.\n\nUpdate ROADMAP with phases 8-12: benchmarks, cross-language stack traces,\ntest coverage hardening, free-threaded Python 3.13+, and v1.0 stabilization.\n\n* fix: use node directly in bench CI to avoid npm output in JSON\n\n* fix: numpy_sum uses np.asarray for buffer compatibility, resilient runner\n\nnumpy_sum and numpy_multiply now explicitly convert input via np.asarray()\nto handle TypedArray buffers correctly across platforms.\n\nBenchmark runner now catches errors per-benchmark and continues, ensuring\nJSON output is always valid even if individual benchmarks fail.\n\n* fix: reduce bench durations, add async timeout, add CI step timeout\n\n- Lower minTimeMs to 500ms and minIter to 20 for faster CI runs\n- Add 30s hard timeout per async benchmark to prevent hangs\n- Add 5-minute timeout on CI step as safety net\n\n* fix: remove async benchmarks that hang in CI, keep sync-only suite\n\nAsync benchmarks via Promise.all cause hangs in CI due to GIL\ncontention with the native addon's async workers. Replace with\nsync CPU benchmarks (fib, sum_squares) that measure the same\ncompute patterns reliably.\n\n* fix: force process.exit after benchmarks complete\n\nThe embedded Python interpreter keeps background threads alive,\npreventing Node.js from exiting naturally after JSON output.\n\n* fix: skip gh-pages fetch until branch exists\n\n* fix: remove skip-fetch-gh-pages now that branch exists\n\n* fix: force Node.js 24 for github-action-benchmark to suppress deprecation warning",
          "timestamp": "2026-03-29T11:28:23+02:00",
          "tree_id": "6aa533b02cfa1b7913bce2fc61b772c2db00da4e",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/b9367b96ceb448fbf8e342c48ebeed9a040f1050"
        },
        "date": 1774776549397,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2858083.46,
            "range": "± 46 µs",
            "unit": "ops/sec",
            "extra": "avg 0.35 µs | min 0.32 µs | max 92.12 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1488757.1,
            "range": "± 51 µs",
            "unit": "ops/sec",
            "extra": "avg 0.67 µs | min 0.62 µs | max 102.44 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1429809.61,
            "range": "± 38 µs",
            "unit": "ops/sec",
            "extra": "avg 0.70 µs | min 0.65 µs | max 77.03 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1246301.32,
            "range": "± 63 µs",
            "unit": "ops/sec",
            "extra": "avg 0.80 µs | min 0.74 µs | max 125.81 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 584425.09,
            "range": "± 55 µs",
            "unit": "ops/sec",
            "extra": "avg 1.71 µs | min 1.48 µs | max 110.51 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 28801.87,
            "range": "± 113 µs",
            "unit": "ops/sec",
            "extra": "avg 34.72 µs | min 26.51 µs | max 252.25 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 217892.69,
            "range": "± 127 µs",
            "unit": "ops/sec",
            "extra": "avg 4.59 µs | min 4.38 µs | max 259.33 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 81004.81,
            "range": "± 58 µs",
            "unit": "ops/sec",
            "extra": "avg 12.34 µs | min 11.83 µs | max 128.33 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 750.76,
            "range": "± 95 µs",
            "unit": "ops/sec",
            "extra": "avg 1331.98 µs | min 1292.72 µs | max 1482.64 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 21642.47,
            "range": "± 110 µs",
            "unit": "ops/sec",
            "extra": "avg 46.21 µs | min 43.88 µs | max 263.10 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 187.21,
            "range": "± 339 µs",
            "unit": "ops/sec",
            "extra": "avg 5341.61 µs | min 5194.95 µs | max 5872.75 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5296.79,
            "range": "± 197 µs",
            "unit": "ops/sec",
            "extra": "avg 188.79 µs | min 184.38 µs | max 578.41 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 73751.26,
            "range": "± 129 µs",
            "unit": "ops/sec",
            "extra": "avg 13.56 µs | min 13.08 µs | max 271.02 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 40570.14,
            "range": "± 1319 µs",
            "unit": "ops/sec",
            "extra": "avg 24.65 µs | min 18.66 µs | max 2656.66 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 234116.09,
            "range": "± 4413 µs",
            "unit": "ops/sec",
            "extra": "avg 4.27 µs | min 3.01 µs | max 8829.69 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13910.84,
            "range": "± 44 µs",
            "unit": "ops/sec",
            "extra": "avg 71.89 µs | min 68.84 µs | max 156.39 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1361.2,
            "range": "± 290 µs",
            "unit": "ops/sec",
            "extra": "avg 734.65 µs | min 712.58 µs | max 1292.70 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9290,
            "range": "± 3495 µs",
            "unit": "ops/sec",
            "extra": "avg 107.64 µs | min 100.69 µs | max 7090.49 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 616385.27,
            "range": "± 2655 µs",
            "unit": "ops/sec",
            "extra": "avg 1.62 µs | min 1.50 µs | max 5311.95 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1415.52,
            "range": "± 61 µs",
            "unit": "ops/sec",
            "extra": "avg 706.46 µs | min 691.88 µs | max 813.23 µs"
          }
        ]
      }
    ]
  }
}
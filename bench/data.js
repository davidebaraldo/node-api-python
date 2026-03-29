window.BENCHMARK_DATA = {
  "lastUpdate": 1774804062382,
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
      },
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
          "id": "0a3242f8efbfd6aedab8fb6ea4e3e3c0cc8f0793",
          "message": "docs: add benchmarks section to README",
          "timestamp": "2026-03-29T11:32:56+02:00",
          "tree_id": "3c3f0a9a1b6770069c31da5647dfe7de4374de7d",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/0a3242f8efbfd6aedab8fb6ea4e3e3c0cc8f0793"
        },
        "date": 1774776825460,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2867263.14,
            "range": "± 289 µs",
            "unit": "ops/sec",
            "extra": "avg 0.35 µs | min 0.31 µs | max 578.84 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1495484.82,
            "range": "± 38 µs",
            "unit": "ops/sec",
            "extra": "avg 0.67 µs | min 0.61 µs | max 76.49 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1441258.97,
            "range": "± 14 µs",
            "unit": "ops/sec",
            "extra": "avg 0.69 µs | min 0.64 µs | max 28.57 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1214010.79,
            "range": "± 49 µs",
            "unit": "ops/sec",
            "extra": "avg 0.82 µs | min 0.75 µs | max 99.67 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 578751.03,
            "range": "± 73 µs",
            "unit": "ops/sec",
            "extra": "avg 1.73 µs | min 1.48 µs | max 147.13 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 29149.47,
            "range": "± 142 µs",
            "unit": "ops/sec",
            "extra": "avg 34.31 µs | min 26.56 µs | max 310.13 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 213944.68,
            "range": "± 74 µs",
            "unit": "ops/sec",
            "extra": "avg 4.67 µs | min 4.46 µs | max 153.15 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 80233.02,
            "range": "± 83 µs",
            "unit": "ops/sec",
            "extra": "avg 12.46 µs | min 11.93 µs | max 178.82 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 750.29,
            "range": "± 91 µs",
            "unit": "ops/sec",
            "extra": "avg 1332.81 µs | min 1298.26 µs | max 1479.28 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 20988.29,
            "range": "± 79 µs",
            "unit": "ops/sec",
            "extra": "avg 47.65 µs | min 45.11 µs | max 203.41 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 181.05,
            "range": "± 2473 µs",
            "unit": "ops/sec",
            "extra": "avg 5523.31 µs | min 5177.16 µs | max 10123.19 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5253.39,
            "range": "± 198 µs",
            "unit": "ops/sec",
            "extra": "avg 190.35 µs | min 185.12 µs | max 581.11 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 71779.21,
            "range": "± 101 µs",
            "unit": "ops/sec",
            "extra": "avg 13.93 µs | min 13.21 µs | max 215.46 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 15977.8,
            "range": "± 1810 µs",
            "unit": "ops/sec",
            "extra": "avg 62.59 µs | min 24.92 µs | max 3644.60 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 224194.55,
            "range": "± 4568 µs",
            "unit": "ops/sec",
            "extra": "avg 4.46 µs | min 3.01 µs | max 9139.28 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13795.21,
            "range": "± 36 µs",
            "unit": "ops/sec",
            "extra": "avg 72.49 µs | min 68.67 µs | max 140.21 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1391,
            "range": "± 66 µs",
            "unit": "ops/sec",
            "extra": "avg 718.91 µs | min 694.75 µs | max 826.61 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 8696.48,
            "range": "± 97 µs",
            "unit": "ops/sec",
            "extra": "avg 114.99 µs | min 100.69 µs | max 295.48 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 634687.13,
            "range": "± 2160 µs",
            "unit": "ops/sec",
            "extra": "avg 1.58 µs | min 1.45 µs | max 4321.35 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1579.22,
            "range": "± 39 µs",
            "unit": "ops/sec",
            "extra": "avg 633.22 µs | min 616.14 µs | max 693.33 µs"
          }
        ]
      },
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
          "id": "b6b1d8a584273e1e11ba803ecec300eda745aeb5",
          "message": "feat: cross-language stack traces with structured Python error info (v0.9.0)\n\nWhen Python raises an exception, the JS Error now includes:\n- error.pythonType: exception class name (e.g. \"ValueError\")\n- error.pythonMessage: the exception message\n- error.pythonTraceback: array of {file, line, function, source} frames\n- error.stack: combined Python + JS stack trace with boundary marker\n\nWorks for both sync (ThrowPythonError) and async (PyCallWorker) errors.\nAdds PythonError and PythonTracebackFrame TypeScript types.\n\nBump to v0.9.0. Update ROADMAP Phase 9 as complete.",
          "timestamp": "2026-03-29T19:06:54+02:00",
          "tree_id": "761156fd899ac8c1709fea2b6766a53f85c5eed9",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/b6b1d8a584273e1e11ba803ecec300eda745aeb5"
        },
        "date": 1774804061724,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2768159.31,
            "range": "± 51 µs",
            "unit": "ops/sec",
            "extra": "avg 0.36 µs | min 0.32 µs | max 102.38 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1473502.23,
            "range": "± 74 µs",
            "unit": "ops/sec",
            "extra": "avg 0.68 µs | min 0.63 µs | max 148.51 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1414106.83,
            "range": "± 69 µs",
            "unit": "ops/sec",
            "extra": "avg 0.71 µs | min 0.65 µs | max 139.15 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1202933.66,
            "range": "± 62 µs",
            "unit": "ops/sec",
            "extra": "avg 0.83 µs | min 0.76 µs | max 123.87 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 578996.22,
            "range": "± 65 µs",
            "unit": "ops/sec",
            "extra": "avg 1.73 µs | min 1.47 µs | max 130.79 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 28425.67,
            "range": "± 153 µs",
            "unit": "ops/sec",
            "extra": "avg 35.18 µs | min 26.63 µs | max 332.72 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 214371.87,
            "range": "± 108 µs",
            "unit": "ops/sec",
            "extra": "avg 4.66 µs | min 4.45 µs | max 221.42 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 82919.44,
            "range": "± 83 µs",
            "unit": "ops/sec",
            "extra": "avg 12.06 µs | min 11.51 µs | max 177.37 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 770.62,
            "range": "± 91 µs",
            "unit": "ops/sec",
            "extra": "avg 1297.65 µs | min 1266.72 µs | max 1448.04 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 21331.81,
            "range": "± 60 µs",
            "unit": "ops/sec",
            "extra": "avg 46.88 µs | min 44.89 µs | max 165.76 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 180.72,
            "range": "± 1354 µs",
            "unit": "ops/sec",
            "extra": "avg 5533.52 µs | min 5282.57 µs | max 7991.02 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5340.02,
            "range": "± 196 µs",
            "unit": "ops/sec",
            "extra": "avg 187.27 µs | min 182.21 µs | max 574.15 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 72842.6,
            "range": "± 117 µs",
            "unit": "ops/sec",
            "extra": "avg 13.73 µs | min 13.11 µs | max 246.69 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 37605.3,
            "range": "± 1342 µs",
            "unit": "ops/sec",
            "extra": "avg 26.59 µs | min 19.46 µs | max 2703.32 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 223186.66,
            "range": "± 4773 µs",
            "unit": "ops/sec",
            "extra": "avg 4.48 µs | min 3.02 µs | max 9548.72 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13803.57,
            "range": "± 67 µs",
            "unit": "ops/sec",
            "extra": "avg 72.45 µs | min 69.27 µs | max 203.76 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1349.93,
            "range": "± 48 µs",
            "unit": "ops/sec",
            "extra": "avg 740.78 µs | min 720.45 µs | max 817.23 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9485.1,
            "range": "± 3192 µs",
            "unit": "ops/sec",
            "extra": "avg 105.43 µs | min 99.13 µs | max 6483.09 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 603190.8,
            "range": "± 2256 µs",
            "unit": "ops/sec",
            "extra": "avg 1.66 µs | min 1.50 µs | max 4513.57 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1463.46,
            "range": "± 100 µs",
            "unit": "ops/sec",
            "extra": "avg 683.31 µs | min 667.70 µs | max 866.70 µs"
          }
        ]
      }
    ]
  }
}
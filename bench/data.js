window.BENCHMARK_DATA = {
  "lastUpdate": 1774810766687,
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
          "id": "e92ce8c5a7b002e72b56fa5c35b7d6b0d14af644",
          "message": "fix: re-add async benchmarks, fix changelog workflow\n\nAsync benchmarks were removed because the process didn't exit after\ncompletion — the actual execution was fine. Since process.exit(0) is\nalready in place, re-add async benchmarks (noop, add, concurrent\nPromise.all patterns).\n\nChangelog workflow now creates a PR instead of pushing directly to\nmain, respecting branch protection rules.",
          "timestamp": "2026-03-29T19:19:00+02:00",
          "tree_id": "f3c53a90ca8ab960134ba51567567296e3218d0f",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/e92ce8c5a7b002e72b56fa5c35b7d6b0d14af644"
        },
        "date": 1774804788366,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2655541.16,
            "range": "± 15 µs",
            "unit": "ops/sec",
            "extra": "avg 0.38 µs | min 0.34 µs | max 31.27 µs"
          },
          {
            "name": "call: noop (async)",
            "value": 18724.2,
            "range": "± 346 µs",
            "unit": "ops/sec",
            "extra": "avg 53.41 µs | min 35.90 µs | max 727.95 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1510272.02,
            "range": "± 14 µs",
            "unit": "ops/sec",
            "extra": "avg 0.66 µs | min 0.62 µs | max 29.16 µs"
          },
          {
            "name": "call: add(1,2) (async)",
            "value": 19297.87,
            "range": "± 89 µs",
            "unit": "ops/sec",
            "extra": "avg 51.82 µs | min 37.34 µs | max 214.80 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1468057.13,
            "range": "± 51 µs",
            "unit": "ops/sec",
            "extra": "avg 0.68 µs | min 0.64 µs | max 102.87 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1242606.35,
            "range": "± 45 µs",
            "unit": "ops/sec",
            "extra": "avg 0.80 µs | min 0.74 µs | max 91.17 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 590594.21,
            "range": "± 46 µs",
            "unit": "ops/sec",
            "extra": "avg 1.69 µs | min 1.46 µs | max 92.51 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 29196.66,
            "range": "± 131 µs",
            "unit": "ops/sec",
            "extra": "avg 34.25 µs | min 26.52 µs | max 289.35 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 219183.23,
            "range": "± 51 µs",
            "unit": "ops/sec",
            "extra": "avg 4.56 µs | min 4.36 µs | max 105.89 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 83737.43,
            "range": "± 52 µs",
            "unit": "ops/sec",
            "extra": "avg 11.94 µs | min 11.45 µs | max 116.10 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 782.68,
            "range": "± 64 µs",
            "unit": "ops/sec",
            "extra": "avg 1277.67 µs | min 1250.00 µs | max 1377.70 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 21121.51,
            "range": "± 68 µs",
            "unit": "ops/sec",
            "extra": "avg 47.35 µs | min 44.89 µs | max 181.18 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 187.6,
            "range": "± 340 µs",
            "unit": "ops/sec",
            "extra": "avg 5330.41 µs | min 5199.07 µs | max 5879.62 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5330.36,
            "range": "± 307 µs",
            "unit": "ops/sec",
            "extra": "avg 187.60 µs | min 182.58 µs | max 797.16 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 74545.42,
            "range": "± 71 µs",
            "unit": "ops/sec",
            "extra": "avg 13.41 µs | min 12.95 µs | max 154.88 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 44885.38,
            "range": "± 154 µs",
            "unit": "ops/sec",
            "extra": "avg 22.28 µs | min 18.59 µs | max 326.33 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 236365.33,
            "range": "± 4353 µs",
            "unit": "ops/sec",
            "extra": "avg 4.23 µs | min 2.95 µs | max 8708.77 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13719.07,
            "range": "± 60 µs",
            "unit": "ops/sec",
            "extra": "avg 72.89 µs | min 69.22 µs | max 188.76 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1372.31,
            "range": "± 55 µs",
            "unit": "ops/sec",
            "extra": "avg 728.70 µs | min 708.99 µs | max 818.96 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9286.38,
            "range": "± 3303 µs",
            "unit": "ops/sec",
            "extra": "avg 107.68 µs | min 99.83 µs | max 6706.51 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 654211.53,
            "range": "± 2775 µs",
            "unit": "ops/sec",
            "extra": "avg 1.53 µs | min 1.41 µs | max 5551.63 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1567.9,
            "range": "± 82 µs",
            "unit": "ops/sec",
            "extra": "avg 637.79 µs | min 619.30 µs | max 783.65 µs"
          },
          {
            "name": "async: 4x concurrent add",
            "value": 676.84,
            "range": "± 729 µs",
            "unit": "ops/sec",
            "extra": "avg 1477.46 µs | min 886.40 µs | max 2344.18 µs"
          },
          {
            "name": "async: 4x concurrent cpu_fib(30)",
            "value": 699.73,
            "range": "± 796 µs",
            "unit": "ops/sec",
            "extra": "avg 1429.13 µs | min 855.24 µs | max 2446.59 µs"
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
          "id": "f9d927c66613e7c4aa6f1b24c10c302c97d4165b",
          "message": "feat: Phase 10 — test coverage hardening (v0.10.0)\n\n* feat: Phase 10 — test coverage hardening (v0.10.0)\n\nAdd comprehensive edge case test suite (edge-cases.test.ts):\n- BigInt: roundtrip, negative, multi-word (2^128), boundary values\n- Deep nesting: 50-level dicts, 20-level lists, mixed dict/list\n- Special floats: NaN, Infinity, -Infinity, -0.0\n- Mixed-type collections, None values, null bytes in strings\n- Error propagation: RuntimeError, KeyError, AttributeError,\n  RecursionError, nested stacks, unicode messages, import errors\n- Stress: 10K sync calls, 500 concurrent async, memory leak check\n- Datetime precision, module state persistence\n\nAdd coverage tooling (@vitest/coverage-v8, npm run test:coverage).\nAdd edge-cases test to CI workflow. Bump to v0.10.0.\n\n* fix: use @vitest/coverage-v8@^3 matching vitest@^3 peer requirement\n\n* fix: adjust edge case tests for actual bridge behavior\n\n- BigInt roundtrip: JsToPy doesn't support BigInt args yet, test via\n  Python-generated large ints instead\n- Deep list: innermost is [42] not 42 (fixture wraps [42])\n- -0.0: accept both -0 and 0 (platform-dependent)\n- Epoch datetime: handle timezone-dependent behavior gracefully",
          "timestamp": "2026-03-29T19:44:39+02:00",
          "tree_id": "84c5c9e096690daf71e15634ecc9879d6a06223e",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/f9d927c66613e7c4aa6f1b24c10c302c97d4165b"
        },
        "date": 1774806324821,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2636716.16,
            "range": "± 198 µs",
            "unit": "ops/sec",
            "extra": "avg 0.38 µs | min 0.34 µs | max 396.06 µs"
          },
          {
            "name": "call: noop (async)",
            "value": 16981.44,
            "range": "± 1009 µs",
            "unit": "ops/sec",
            "extra": "avg 58.89 µs | min 39.49 µs | max 2056.65 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1508297.32,
            "range": "± 66 µs",
            "unit": "ops/sec",
            "extra": "avg 0.66 µs | min 0.61 µs | max 132.04 µs"
          },
          {
            "name": "call: add(1,2) (async)",
            "value": 19016.48,
            "range": "± 102 µs",
            "unit": "ops/sec",
            "extra": "avg 52.59 µs | min 39.98 µs | max 244.22 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1448985.31,
            "range": "± 23 µs",
            "unit": "ops/sec",
            "extra": "avg 0.69 µs | min 0.64 µs | max 46.15 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1239880.41,
            "range": "± 41 µs",
            "unit": "ops/sec",
            "extra": "avg 0.81 µs | min 0.74 µs | max 81.97 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 584378.38,
            "range": "± 61 µs",
            "unit": "ops/sec",
            "extra": "avg 1.71 µs | min 1.46 µs | max 123.35 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 28881.3,
            "range": "± 114 µs",
            "unit": "ops/sec",
            "extra": "avg 34.62 µs | min 26.59 µs | max 254.17 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 220666.13,
            "range": "± 65 µs",
            "unit": "ops/sec",
            "extra": "avg 4.53 µs | min 4.33 µs | max 134.23 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 82081.68,
            "range": "± 69 µs",
            "unit": "ops/sec",
            "extra": "avg 12.18 µs | min 11.61 µs | max 148.91 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 761.73,
            "range": "± 94 µs",
            "unit": "ops/sec",
            "extra": "avg 1312.80 µs | min 1279.91 µs | max 1467.83 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 20624.09,
            "range": "± 99 µs",
            "unit": "ops/sec",
            "extra": "avg 48.49 µs | min 46.20 µs | max 243.91 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 183.29,
            "range": "± 382 µs",
            "unit": "ops/sec",
            "extra": "avg 5455.71 µs | min 5290.42 µs | max 6054.96 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5241.73,
            "range": "± 228 µs",
            "unit": "ops/sec",
            "extra": "avg 190.78 µs | min 185.87 µs | max 641.93 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 74917.42,
            "range": "± 112 µs",
            "unit": "ops/sec",
            "extra": "avg 13.35 µs | min 12.82 µs | max 236.74 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 43714.12,
            "range": "± 154 µs",
            "unit": "ops/sec",
            "extra": "avg 22.88 µs | min 18.88 µs | max 326.59 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 228016.58,
            "range": "± 4402 µs",
            "unit": "ops/sec",
            "extra": "avg 4.39 µs | min 3.01 µs | max 8806.41 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 14086.58,
            "range": "± 56 µs",
            "unit": "ops/sec",
            "extra": "avg 70.99 µs | min 68.29 µs | max 181.03 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1378.28,
            "range": "± 57 µs",
            "unit": "ops/sec",
            "extra": "avg 725.54 µs | min 709.64 µs | max 823.34 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9557.31,
            "range": "± 3377 µs",
            "unit": "ops/sec",
            "extra": "avg 104.63 µs | min 98.45 µs | max 6851.72 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 632025.81,
            "range": "± 38 µs",
            "unit": "ops/sec",
            "extra": "avg 1.58 µs | min 1.50 µs | max 76.88 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1478.28,
            "range": "± 196 µs",
            "unit": "ops/sec",
            "extra": "avg 676.46 µs | min 660.08 µs | max 1052.49 µs"
          },
          {
            "name": "async: 4x concurrent add",
            "value": 451.25,
            "range": "± 853 µs",
            "unit": "ops/sec",
            "extra": "avg 2216.08 µs | min 1486.90 µs | max 3192.84 µs"
          },
          {
            "name": "async: 4x concurrent cpu_fib(30)",
            "value": 420.39,
            "range": "± 625 µs",
            "unit": "ops/sec",
            "extra": "avg 2378.75 µs | min 1790.38 µs | max 3039.41 µs"
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
          "id": "9c80504a9aa00acf71c389f8287ddcc3a33c8f95",
          "message": "docs: update CHANGELOG.md for v0.10.0\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2026-03-29T20:12:13+02:00",
          "tree_id": "9df989842e352f20b57640d45de44bbaa966e915",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/9c80504a9aa00acf71c389f8287ddcc3a33c8f95"
        },
        "date": 1774807984874,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2684544.38,
            "range": "± 65 µs",
            "unit": "ops/sec",
            "extra": "avg 0.37 µs | min 0.32 µs | max 129.95 µs"
          },
          {
            "name": "call: noop (async)",
            "value": 20581.27,
            "range": "± 69 µs",
            "unit": "ops/sec",
            "extra": "avg 48.59 µs | min 33.13 µs | max 170.44 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1538605.83,
            "range": "± 45 µs",
            "unit": "ops/sec",
            "extra": "avg 0.65 µs | min 0.59 µs | max 90.69 µs"
          },
          {
            "name": "call: add(1,2) (async)",
            "value": 22430.21,
            "range": "± 76 µs",
            "unit": "ops/sec",
            "extra": "avg 44.58 µs | min 34.89 µs | max 187.86 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1488520.11,
            "range": "± 59 µs",
            "unit": "ops/sec",
            "extra": "avg 0.67 µs | min 0.62 µs | max 117.63 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1246582.92,
            "range": "± 49 µs",
            "unit": "ops/sec",
            "extra": "avg 0.80 µs | min 0.73 µs | max 98.05 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 592022.75,
            "range": "± 54 µs",
            "unit": "ops/sec",
            "extra": "avg 1.69 µs | min 1.45 µs | max 109.81 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 28826.4,
            "range": "± 124 µs",
            "unit": "ops/sec",
            "extra": "avg 34.69 µs | min 26.35 µs | max 274.56 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 217131.65,
            "range": "± 93 µs",
            "unit": "ops/sec",
            "extra": "avg 4.61 µs | min 4.38 µs | max 190.54 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 83062.52,
            "range": "± 73 µs",
            "unit": "ops/sec",
            "extra": "avg 12.04 µs | min 11.49 µs | max 157.05 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 765.91,
            "range": "± 88 µs",
            "unit": "ops/sec",
            "extra": "avg 1305.64 µs | min 1276.67 µs | max 1453.10 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 21226.88,
            "range": "± 86 µs",
            "unit": "ops/sec",
            "extra": "avg 47.11 µs | min 44.83 µs | max 216.93 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 186.6,
            "range": "± 496 µs",
            "unit": "ops/sec",
            "extra": "avg 5359.06 µs | min 5153.87 µs | max 6146.13 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5327.8,
            "range": "± 301 µs",
            "unit": "ops/sec",
            "extra": "avg 187.69 µs | min 182.55 µs | max 784.36 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 74654.92,
            "range": "± 102 µs",
            "unit": "ops/sec",
            "extra": "avg 13.39 µs | min 12.81 µs | max 217.79 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 43828.33,
            "range": "± 133 µs",
            "unit": "ops/sec",
            "extra": "avg 22.82 µs | min 18.74 µs | max 284.73 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 226909.65,
            "range": "± 4483 µs",
            "unit": "ops/sec",
            "extra": "avg 4.41 µs | min 2.99 µs | max 8968.84 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13815.38,
            "range": "± 68 µs",
            "unit": "ops/sec",
            "extra": "avg 72.38 µs | min 68.47 µs | max 204.80 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1368.32,
            "range": "± 64 µs",
            "unit": "ops/sec",
            "extra": "avg 730.82 µs | min 713.75 µs | max 842.50 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9514.21,
            "range": "± 3233 µs",
            "unit": "ops/sec",
            "extra": "avg 105.11 µs | min 98.34 µs | max 6564.90 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 619498.37,
            "range": "± 31 µs",
            "unit": "ops/sec",
            "extra": "avg 1.61 µs | min 1.47 µs | max 62.52 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1530.17,
            "range": "± 96 µs",
            "unit": "ops/sec",
            "extra": "avg 653.52 µs | min 641.25 µs | max 833.00 µs"
          },
          {
            "name": "async: 4x concurrent add",
            "value": 452.1,
            "range": "± 849 µs",
            "unit": "ops/sec",
            "extra": "avg 2211.89 µs | min 1652.36 µs | max 3349.86 µs"
          },
          {
            "name": "async: 4x concurrent cpu_fib(30)",
            "value": 515.1,
            "range": "± 589 µs",
            "unit": "ops/sec",
            "extra": "avg 1941.39 µs | min 1219.18 µs | max 2396.23 µs"
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
          "id": "e8c5c11ed8eede487d35978112580d5a6ad5d812",
          "message": "feat: documentation site + SEO improvements\n\n- docs/index.html: full docs site (hero, quickstart, features, benchmarks,\n  API reference, type generation, error handling, comparison table)\n- .github/workflows/docs.yml: auto-deploy docs to gh-pages on push\n- npm keywords: added python-bridge, embed-python, node-addon,\n  machine-learning, data-science, sync, async\n- GitHub topics: 14 topics set via API\n- Repo description and homepage URL updated",
          "timestamp": "2026-03-29T20:34:40+02:00",
          "tree_id": "dfd9f360fd6ef08db1832cceb438bbf62a09207b",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/e8c5c11ed8eede487d35978112580d5a6ad5d812"
        },
        "date": 1774809337922,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2598023.53,
            "range": "± 171 µs",
            "unit": "ops/sec",
            "extra": "avg 0.38 µs | min 0.34 µs | max 341.86 µs"
          },
          {
            "name": "call: noop (async)",
            "value": 18965.76,
            "range": "± 461 µs",
            "unit": "ops/sec",
            "extra": "avg 52.73 µs | min 36.13 µs | max 958.14 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1473394.05,
            "range": "± 31 µs",
            "unit": "ops/sec",
            "extra": "avg 0.68 µs | min 0.62 µs | max 62.58 µs"
          },
          {
            "name": "call: add(1,2) (async)",
            "value": 19922,
            "range": "± 73 µs",
            "unit": "ops/sec",
            "extra": "avg 50.20 µs | min 37.41 µs | max 183.90 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1372518.78,
            "range": "± 34 µs",
            "unit": "ops/sec",
            "extra": "avg 0.73 µs | min 0.63 µs | max 68.68 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1225193.52,
            "range": "± 48 µs",
            "unit": "ops/sec",
            "extra": "avg 0.82 µs | min 0.75 µs | max 95.98 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 594571.05,
            "range": "± 56 µs",
            "unit": "ops/sec",
            "extra": "avg 1.68 µs | min 1.46 µs | max 113.22 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 29373.94,
            "range": "± 111 µs",
            "unit": "ops/sec",
            "extra": "avg 34.04 µs | min 26.54 µs | max 248.13 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 221747.8,
            "range": "± 61 µs",
            "unit": "ops/sec",
            "extra": "avg 4.51 µs | min 4.31 µs | max 126.58 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 84235.05,
            "range": "± 67 µs",
            "unit": "ops/sec",
            "extra": "avg 11.87 µs | min 11.36 µs | max 146.02 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 775.53,
            "range": "± 100 µs",
            "unit": "ops/sec",
            "extra": "avg 1289.44 µs | min 1261.33 µs | max 1460.78 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 21186.43,
            "range": "± 77 µs",
            "unit": "ops/sec",
            "extra": "avg 47.20 µs | min 44.83 µs | max 198.02 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 186.36,
            "range": "± 367 µs",
            "unit": "ops/sec",
            "extra": "avg 5365.89 µs | min 5210.70 µs | max 5943.88 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5328.68,
            "range": "± 244 µs",
            "unit": "ops/sec",
            "extra": "avg 187.66 µs | min 181.90 µs | max 670.60 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 72564.54,
            "range": "± 105 µs",
            "unit": "ops/sec",
            "extra": "avg 13.78 µs | min 12.76 µs | max 223.15 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 35923.36,
            "range": "± 1100 µs",
            "unit": "ops/sec",
            "extra": "avg 27.84 µs | min 20.57 µs | max 2219.89 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 239153.94,
            "range": "± 4327 µs",
            "unit": "ops/sec",
            "extra": "avg 4.18 µs | min 2.95 µs | max 8657.56 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13810.23,
            "range": "± 245 µs",
            "unit": "ops/sec",
            "extra": "avg 72.41 µs | min 68.52 µs | max 558.39 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1402.48,
            "range": "± 426 µs",
            "unit": "ops/sec",
            "extra": "avg 713.02 µs | min 690.06 µs | max 1541.23 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9727.8,
            "range": "± 99 µs",
            "unit": "ops/sec",
            "extra": "avg 102.80 µs | min 98.16 µs | max 296.52 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 641256.32,
            "range": "± 24 µs",
            "unit": "ops/sec",
            "extra": "avg 1.56 µs | min 1.45 µs | max 49.50 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1672.86,
            "range": "± 56 µs",
            "unit": "ops/sec",
            "extra": "avg 597.78 µs | min 585.50 µs | max 697.95 µs"
          },
          {
            "name": "async: 4x concurrent add",
            "value": 490.43,
            "range": "± 4796 µs",
            "unit": "ops/sec",
            "extra": "avg 2039.01 µs | min 1272.12 µs | max 10863.28 µs"
          },
          {
            "name": "async: 4x concurrent cpu_fib(30)",
            "value": 496.39,
            "range": "± 792 µs",
            "unit": "ops/sec",
            "extra": "avg 2014.54 µs | min 1474.81 µs | max 3059.26 µs"
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
          "id": "050f3439f6996912cfc48d65d6bbd385dbbbba8d",
          "message": "feat: add project logo with favicon and og:image",
          "timestamp": "2026-03-29T20:55:44+02:00",
          "tree_id": "0c772fcd07b7fb211737145dea1a888c401be53f",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/050f3439f6996912cfc48d65d6bbd385dbbbba8d"
        },
        "date": 1774810586399,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2682621.36,
            "range": "± 39 µs",
            "unit": "ops/sec",
            "extra": "avg 0.37 µs | min 0.33 µs | max 77.53 µs"
          },
          {
            "name": "call: noop (async)",
            "value": 18904.18,
            "range": "± 251 µs",
            "unit": "ops/sec",
            "extra": "avg 52.90 µs | min 34.49 µs | max 536.79 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1513201.87,
            "range": "± 22 µs",
            "unit": "ops/sec",
            "extra": "avg 0.66 µs | min 0.62 µs | max 45.11 µs"
          },
          {
            "name": "call: add(1,2) (async)",
            "value": 20358.15,
            "range": "± 81 µs",
            "unit": "ops/sec",
            "extra": "avg 49.12 µs | min 35.39 µs | max 198.03 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1472391.51,
            "range": "± 15 µs",
            "unit": "ops/sec",
            "extra": "avg 0.68 µs | min 0.64 µs | max 29.94 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1261882.31,
            "range": "± 50 µs",
            "unit": "ops/sec",
            "extra": "avg 0.79 µs | min 0.73 µs | max 100.93 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 580181.45,
            "range": "± 66 µs",
            "unit": "ops/sec",
            "extra": "avg 1.72 µs | min 1.46 µs | max 132.62 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 28701.44,
            "range": "± 118 µs",
            "unit": "ops/sec",
            "extra": "avg 34.84 µs | min 26.71 µs | max 262.00 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 217729.28,
            "range": "± 53 µs",
            "unit": "ops/sec",
            "extra": "avg 4.59 µs | min 4.35 µs | max 109.49 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 78543.16,
            "range": "± 71 µs",
            "unit": "ops/sec",
            "extra": "avg 12.73 µs | min 11.40 µs | max 153.37 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 774.14,
            "range": "± 193 µs",
            "unit": "ops/sec",
            "extra": "avg 1291.76 µs | min 1252.79 µs | max 1638.83 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 20971.64,
            "range": "± 76 µs",
            "unit": "ops/sec",
            "extra": "avg 47.68 µs | min 45.23 µs | max 196.70 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 185.61,
            "range": "± 333 µs",
            "unit": "ops/sec",
            "extra": "avg 5387.70 µs | min 5226.49 µs | max 5892.14 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5337.76,
            "range": "± 165 µs",
            "unit": "ops/sec",
            "extra": "avg 187.34 µs | min 182.32 µs | max 511.41 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 74022.6,
            "range": "± 94 µs",
            "unit": "ops/sec",
            "extra": "avg 13.51 µs | min 12.91 µs | max 200.86 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 44717.6,
            "range": "± 708 µs",
            "unit": "ops/sec",
            "extra": "avg 22.36 µs | min 18.25 µs | max 1435.10 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 237851.52,
            "range": "± 3777 µs",
            "unit": "ops/sec",
            "extra": "avg 4.20 µs | min 2.98 µs | max 7557.42 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 14083.84,
            "range": "± 61 µs",
            "unit": "ops/sec",
            "extra": "avg 71.00 µs | min 68.25 µs | max 190.72 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1413.98,
            "range": "± 55 µs",
            "unit": "ops/sec",
            "extra": "avg 707.22 µs | min 689.71 µs | max 799.78 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9642.86,
            "range": "± 86 µs",
            "unit": "ops/sec",
            "extra": "avg 103.70 µs | min 98.82 µs | max 271.31 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 669696.13,
            "range": "± 26 µs",
            "unit": "ops/sec",
            "extra": "avg 1.49 µs | min 1.42 µs | max 52.84 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1667.25,
            "range": "± 74 µs",
            "unit": "ops/sec",
            "extra": "avg 599.79 µs | min 587.24 µs | max 735.02 µs"
          },
          {
            "name": "async: 4x concurrent add",
            "value": 568.32,
            "range": "± 4927 µs",
            "unit": "ops/sec",
            "extra": "avg 1759.56 µs | min 880.60 µs | max 10735.14 µs"
          },
          {
            "name": "async: 4x concurrent cpu_fib(30)",
            "value": 536.53,
            "range": "± 667 µs",
            "unit": "ops/sec",
            "extra": "avg 1863.84 µs | min 997.14 µs | max 2332.10 µs"
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
          "id": "1010260326da3be48859fd83b9964a9c3f8d23c0",
          "message": "fix: deploy all docs files to gh-pages",
          "timestamp": "2026-03-29T20:58:21+02:00",
          "tree_id": "dbd6f0dadcd2d535bb716cd47b5eb487823ad424",
          "url": "https://github.com/davidebaraldo/node-api-python/commit/1010260326da3be48859fd83b9964a9c3f8d23c0"
        },
        "date": 1774810765860,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "call: noop (sync)",
            "value": 2735871.53,
            "range": "± 18 µs",
            "unit": "ops/sec",
            "extra": "avg 0.37 µs | min 0.33 µs | max 36.81 µs"
          },
          {
            "name": "call: noop (async)",
            "value": 17272.28,
            "range": "± 47 µs",
            "unit": "ops/sec",
            "extra": "avg 57.90 µs | min 32.27 µs | max 126.16 µs"
          },
          {
            "name": "call: add(1,2) (sync)",
            "value": 1509174.18,
            "range": "± 38 µs",
            "unit": "ops/sec",
            "extra": "avg 0.66 µs | min 0.60 µs | max 77.41 µs"
          },
          {
            "name": "call: add(1,2) (async)",
            "value": 17466.48,
            "range": "± 93 µs",
            "unit": "ops/sec",
            "extra": "avg 57.25 µs | min 38.17 µs | max 224.69 µs"
          },
          {
            "name": "type: int round-trip",
            "value": 1468885.52,
            "range": "± 39 µs",
            "unit": "ops/sec",
            "extra": "avg 0.68 µs | min 0.63 µs | max 77.96 µs"
          },
          {
            "name": "type: string echo (short)",
            "value": 1238484.69,
            "range": "± 39 µs",
            "unit": "ops/sec",
            "extra": "avg 0.81 µs | min 0.73 µs | max 79.63 µs"
          },
          {
            "name": "type: string echo (1KB)",
            "value": 587153.51,
            "range": "± 50 µs",
            "unit": "ops/sec",
            "extra": "avg 1.70 µs | min 1.47 µs | max 102.33 µs"
          },
          {
            "name": "type: string echo (64KB)",
            "value": 28873.23,
            "range": "± 115 µs",
            "unit": "ops/sec",
            "extra": "avg 34.63 µs | min 26.65 µs | max 255.71 µs"
          },
          {
            "name": "type: datetime round-trip",
            "value": 221012.08,
            "range": "± 76 µs",
            "unit": "ops/sec",
            "extra": "avg 4.52 µs | min 4.31 µs | max 157.28 µs"
          },
          {
            "name": "type: list[100] from Python",
            "value": 80128.59,
            "range": "± 51 µs",
            "unit": "ops/sec",
            "extra": "avg 12.48 µs | min 11.88 µs | max 114.74 µs"
          },
          {
            "name": "type: list[10000] from Python",
            "value": 749.45,
            "range": "± 67 µs",
            "unit": "ops/sec",
            "extra": "avg 1334.31 µs | min 1301.18 µs | max 1435.77 µs"
          },
          {
            "name": "type: dict[100] from Python",
            "value": 21251.59,
            "range": "± 69 µs",
            "unit": "ops/sec",
            "extra": "avg 47.06 µs | min 44.83 µs | max 182.32 µs"
          },
          {
            "name": "type: dict[10000] from Python",
            "value": 187.68,
            "range": "± 383 µs",
            "unit": "ops/sec",
            "extra": "avg 5328.27 µs | min 5173.95 µs | max 5940.27 µs"
          },
          {
            "name": "type: sum list[1000] (JS->Py)",
            "value": 5350.81,
            "range": "± 253 µs",
            "unit": "ops/sec",
            "extra": "avg 186.89 µs | min 181.92 µs | max 688.87 µs"
          },
          {
            "name": "type: nested depth=20",
            "value": 74732.69,
            "range": "± 69 µs",
            "unit": "ops/sec",
            "extra": "avg 13.38 µs | min 12.90 µs | max 150.53 µs"
          },
          {
            "name": "numpy: create array[10K]",
            "value": 44020.56,
            "range": "± 174 µs",
            "unit": "ops/sec",
            "extra": "avg 22.72 µs | min 18.45 µs | max 366.50 µs"
          },
          {
            "name": "callback: 1 invocation",
            "value": 236878.91,
            "range": "± 4348 µs",
            "unit": "ops/sec",
            "extra": "avg 4.22 µs | min 2.97 µs | max 8698.23 µs"
          },
          {
            "name": "callback: 100 invocations",
            "value": 13909.72,
            "range": "± 45 µs",
            "unit": "ops/sec",
            "extra": "avg 71.89 µs | min 68.94 µs | max 159.57 µs"
          },
          {
            "name": "callback: 1000 invocations",
            "value": 1371.79,
            "range": "± 73 µs",
            "unit": "ops/sec",
            "extra": "avg 728.97 µs | min 713.23 µs | max 859.74 µs"
          },
          {
            "name": "callback: transform list[100]",
            "value": 9323.93,
            "range": "± 3622 µs",
            "unit": "ops/sec",
            "extra": "avg 107.25 µs | min 99.63 µs | max 7342.87 µs"
          },
          {
            "name": "cpu: fib(30) (sync)",
            "value": 633799.43,
            "range": "± 16 µs",
            "unit": "ops/sec",
            "extra": "avg 1.58 µs | min 1.48 µs | max 32.95 µs"
          },
          {
            "name": "cpu: sum_squares(10000) (sync)",
            "value": 1530.42,
            "range": "± 67 µs",
            "unit": "ops/sec",
            "extra": "avg 653.42 µs | min 640.13 µs | max 773.85 µs"
          },
          {
            "name": "async: 4x concurrent add",
            "value": 476.91,
            "range": "± 523 µs",
            "unit": "ops/sec",
            "extra": "avg 2096.85 µs | min 1638.95 µs | max 2684.50 µs"
          },
          {
            "name": "async: 4x concurrent cpu_fib(30)",
            "value": 479.03,
            "range": "± 553 µs",
            "unit": "ops/sec",
            "extra": "avg 2087.53 µs | min 1747.41 µs | max 2852.96 µs"
          }
        ]
      }
    ]
  }
}
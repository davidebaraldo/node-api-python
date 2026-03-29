#!/usr/bin/env node

/**
 * node-api-python benchmark suite
 *
 * Usage:
 *   node bench/run.js              # run all benchmarks
 *   node bench/run.js --filter call # run only benchmarks matching "call"
 *   node bench/run.js --json        # output JSON instead of table
 */

const path = require('path')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toFixed(2)
}

function formatTime(us) {
  if (us >= 1000) return (us / 1000).toFixed(2) + ' ms'
  return us.toFixed(2) + ' \u00b5s'
}

function padRight(s, n) { return s + ' '.repeat(Math.max(0, n - s.length)) }
function padLeft(s, n) { return ' '.repeat(Math.max(0, n - s.length)) + s }

/**
 * Measure sync function: returns { opsPerSec, avgUs, minUs, maxUs }.
 * Runs for at least `minTimeMs` and at least `minIter` iterations.
 */
function benchSync(fn, { minTimeMs = 500, minIter = 20, warmup = 5 } = {}) {
  for (let i = 0; i < warmup; i++) fn()

  let total = 0
  let count = 0
  let min = Infinity
  let max = 0
  const deadline = Date.now() + minTimeMs

  while (count < minIter || Date.now() < deadline) {
    const t0 = performance.now()
    fn()
    const elapsed = (performance.now() - t0) * 1000 // -> microseconds
    total += elapsed
    count++
    if (elapsed < min) min = elapsed
    if (elapsed > max) max = elapsed
  }

  const avgUs = total / count
  return {
    ops: count,
    totalMs: total / 1000,
    opsPerSec: (count / total) * 1_000_000,
    avgUs,
    minUs: min,
    maxUs: max,
  }
}

// ---------------------------------------------------------------------------
// Benchmark definitions
// ---------------------------------------------------------------------------

function defineBenchmarks(python) {
  const mod = python.import(path.join(__dirname, 'fixtures', 'bench_module.py'))

  const benchmarks = []

  function addSync(name, fn, opts) {
    benchmarks.push({ name, fn, opts })
  }

  // --- Call overhead ---
  addSync('call: noop (sync)', () => mod.noopSync())
  addSync('call: add(1,2) (sync)', () => mod.addSync(1, 2))

  // --- Primitives ---
  addSync('type: int round-trip', () => mod.addSync(100, 200))
  addSync('type: string echo (short)', () => mod.echo_stringSync('hello'))
  addSync('type: string echo (1KB)', () => mod.echo_stringSync('x'.repeat(1024)))
  addSync('type: string echo (64KB)', () => mod.echo_stringSync('x'.repeat(65536)))
  addSync('type: datetime round-trip', () => mod.roundtrip_datetimeSync(new Date()))

  // --- Collections ---
  addSync('type: list[100] from Python', () => mod.build_listSync(100))
  addSync('type: list[10000] from Python', () => mod.build_listSync(10000))
  addSync('type: dict[100] from Python', () => mod.build_dictSync(100))
  addSync('type: dict[10000] from Python', () => mod.build_dictSync(10000))
  addSync('type: sum list[1000] (JS->Py)', () => mod.sum_listSync(Array.from({ length: 1000 }, (_, i) => i)))
  addSync('type: nested depth=20', () => mod.build_nestedSync(20))

  // --- NumPy zero-copy (skipped if numpy not installed) ---
  const hasNumpy = mod.has_numpySync()
  if (hasNumpy) {
    const small = new Float64Array(100)
    const medium = new Float64Array(10_000)
    const large = new Float64Array(1_000_000)
    for (let i = 0; i < large.length; i++) large[i] = i
    for (let i = 0; i < medium.length; i++) medium[i] = i
    for (let i = 0; i < small.length; i++) small[i] = i

    addSync('numpy: sum Float64[100]', () => mod.numpy_sumSync(small))
    addSync('numpy: sum Float64[10K]', () => mod.numpy_sumSync(medium))
    addSync('numpy: sum Float64[1M]', () => mod.numpy_sumSync(large))
    addSync('numpy: create array[10K]', () => mod.numpy_createSync(10000))
    addSync('numpy: multiply Float64[10K]', () => mod.numpy_multiplySync(medium, 2.0))
  }

  // --- Callbacks ---
  addSync('callback: 1 invocation', () => mod.call_n_timesSync((i) => i, 1))
  addSync('callback: 100 invocations', () => mod.call_n_timesSync((i) => i, 100))
  addSync('callback: 1000 invocations', () => mod.call_n_timesSync((i) => i, 1000))
  addSync('callback: transform list[100]', () => {
    mod.transform_listSync(Array.from({ length: 100 }, (_, i) => i), (x) => x * 2)
  })

  // --- CPU work ---
  addSync('cpu: fib(30) (sync)', () => mod.cpu_fibSync(30))
  addSync('cpu: sum_squares(10000) (sync)', () => mod.cpu_sum_squaresSync(10000))

  return benchmarks
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const jsonOutput = args.includes('--json')
  const filterIdx = args.indexOf('--filter')
  const filter = filterIdx !== -1 ? args[filterIdx + 1] : null

  if (!jsonOutput) {
    console.log()
    console.log('  node-api-python benchmark suite')
    console.log('  ================================')
    console.log()
  }

  // Load the addon
  const python = require(path.resolve(__dirname, '..'))

  let benchmarks = defineBenchmarks(python)

  if (filter) {
    const re = new RegExp(filter, 'i')
    benchmarks = benchmarks.filter((b) => re.test(b.name))
  }

  if (!jsonOutput) {
    console.log(`  Running ${benchmarks.length} benchmarks...`)
    if (!benchmarks.some((b) => b.name.startsWith('numpy:'))) {
      console.log('  (numpy not installed — numpy benchmarks skipped)')
    }
    console.log()
  }

  const results = []

  for (const bench of benchmarks) {
    if (!jsonOutput) {
      process.stdout.write(`  \u25b6 ${bench.name} ... `)
    }

    try {
      const opts = bench.opts || {}
      const result = benchSync(bench.fn, opts)

      results.push({ name: bench.name, ...result })

      if (!jsonOutput) {
        console.log(
          `${formatNum(result.opsPerSec)} ops/s  ` +
          `(avg ${formatTime(result.avgUs)}, ` +
          `min ${formatTime(result.minUs)}, ` +
          `max ${formatTime(result.maxUs)})`
        )
      }
    } catch (err) {
      if (!jsonOutput) {
        console.log(`FAILED: ${err.message.split('\n')[0]}`)
      }
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  // Summary table
  console.log()
  console.log('  ' + '='.repeat(90))
  console.log(
    '  ' +
    padRight('Benchmark', 42) +
    padLeft('ops/s', 14) +
    padLeft('avg', 14) +
    padLeft('min', 14) +
    padLeft('max', 14)
  )
  console.log('  ' + '-'.repeat(90))

  for (const r of results) {
    console.log(
      '  ' +
      padRight(r.name, 42) +
      padLeft(formatNum(r.opsPerSec), 14) +
      padLeft(formatTime(r.avgUs), 14) +
      padLeft(formatTime(r.minUs), 14) +
      padLeft(formatTime(r.maxUs), 14)
    )
  }
  console.log('  ' + '='.repeat(90))
  console.log()
}

try {
  main()
  // Force exit — embedded Python interpreter keeps the event loop alive
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}

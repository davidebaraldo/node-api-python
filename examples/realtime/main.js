/**
 * Example: Realtime — bidirectional callbacks and events
 *
 * Run:   node examples/realtime/main.js
 * Shows: Python calling JavaScript callbacks, event emitters,
 *        progress reporting, streaming results
 */

const python = require('node-api-python')

const processor = python.import('./examples/realtime/processor')

async function main() {
  // --- 1. Progress callback ---
  console.log('=== Progress Callback ===')

  await processor.long_task(100, (progress, message) => {
    process.stdout.write(`\r  [${progress}%] ${message}`)
  })
  console.log('')

  // --- 2. Event emitter pattern ---
  console.log('\n=== Event Emitter ===')

  const monitor = processor.create_monitor()

  monitor.on('cpu', (value) => {
    console.log(`  CPU: ${value}%`)
  })

  monitor.on('memory', (value) => {
    console.log(`  Memory: ${value}%`)
  })

  monitor.on('alert', (message) => {
    console.log(`  ALERT: ${message}`)
  })

  await monitor.start(5) // collect 5 samples

  // --- 3. Streaming results ---
  console.log('\n=== Streaming ===')

  for await (const chunk of processor.stream_results(10)) {
    console.log(`  Received chunk: ${JSON.stringify(chunk)}`)
  }
}

main().catch(console.error)

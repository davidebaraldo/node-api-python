/**
 * Example: Basic — calling Python functions from Node.js
 *
 * Run:   node examples/basic/main.js
 * Shows: sync calls, async calls, type conversion
 */

const python = require('node-api-python')

const math = python.import('./examples/basic/math_utils')

// --- Sync calls (blocking, good for scripts) ---

console.log('=== Sync Calls ===')
console.log('2 + 3 =', math.addSync(2, 3))
console.log('2.5 * 4 =', math.multiplySync(2.5, 4))
console.log('Hello:', math.greetSync('World'))

// --- Async calls (non-blocking, good for servers) ---

async function main() {
  console.log('\n=== Async Calls ===')
  const sum = await math.add(10, 20)
  console.log('10 + 20 =', sum)

  const greeting = await math.greet('Node.js')
  console.log(greeting)
}

main().catch(console.error)

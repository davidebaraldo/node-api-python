/**
 * Example: Data Pipeline — process data with pandas from Node.js
 *
 * Run:   node examples/data-pipeline/main.js
 * Shows: passing data to Python, getting structured results back,
 *        working with pandas/numpy from JavaScript
 *
 * Requires: pip install pandas numpy
 */

const python = require('node-api-python')

const pipeline = python.import('./examples/data-pipeline/pipeline')

async function main() {
  // --- 1. Send raw data from JS to Python for processing ---
  console.log('=== Data Processing ===')

  const salesData = [
    { date: '2025-01-15', product: 'Widget A', quantity: 150, price: 29.99 },
    { date: '2025-01-15', product: 'Widget B', quantity: 80, price: 49.99 },
    { date: '2025-02-01', product: 'Widget A', quantity: 200, price: 29.99 },
    { date: '2025-02-01', product: 'Widget B', quantity: 120, price: 49.99 },
    { date: '2025-03-01', product: 'Widget A', quantity: 175, price: 31.99 },
    { date: '2025-03-01', product: 'Widget B', quantity: 95, price: 49.99 },
  ]

  // Python processes the data with pandas and returns results
  const summary = await pipeline.summarize_sales(salesData)
  console.log('Sales summary:', summary)

  // --- 2. Numeric computation with numpy ---
  console.log('\n=== Numeric Analysis ===')

  const values = [23, 45, 12, 67, 34, 89, 11, 56, 78, 43]
  const stats = await pipeline.compute_statistics(values)
  console.log('Statistics:', stats)

  // --- 3. Zero-copy with TypedArray ---
  console.log('\n=== Zero-Copy Arrays ===')

  const largeArray = new Float64Array(10000)
  for (let i = 0; i < largeArray.length; i++) {
    largeArray[i] = Math.random() * 100
  }

  const result = await pipeline.process_array(largeArray)
  console.log('Processed 10,000 elements:', result)
}

main().catch(console.error)

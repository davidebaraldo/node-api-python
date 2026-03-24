/**
 * Example: Express API — Python ML backend served from Node.js
 *
 * Run:   node examples/express-api/server.js
 * Test:  curl http://localhost:3000/predict -X POST -H "Content-Type: application/json" -d '{"text":"hello"}'
 * Shows: async Python calls in Express routes, error handling
 *
 * Requires: npm install express
 */

const express = require('express')
const python = require('node-api-python')

const app = express()
app.use(express.json())

// Load Python modules once at startup
const sentiment = python.import('./examples/express-api/sentiment')
const text = python.import('./examples/express-api/text_processor')

// POST /predict — run Python sentiment analysis
app.post('/predict', async (req, res) => {
  try {
    const { text: inputText } = req.body
    const result = await sentiment.analyze(inputText)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /summarize — Python text summarization
app.post('/summarize', async (req, res) => {
  try {
    const { text: inputText, max_length } = req.body
    const summary = await text.summarize(inputText, max_length || 100)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /stats — sync call for quick stats
app.get('/stats', (req, res) => {
  const stats = text.get_statsSync()
  res.json(stats)
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
  console.log('')
  console.log('Try:')
  console.log('  curl http://localhost:3000/predict -X POST -H "Content-Type: application/json" -d \'{"text":"I love this product!"}\'')
  console.log('  curl http://localhost:3000/summarize -X POST -H "Content-Type: application/json" -d \'{"text":"Long text here..."}\'')
  console.log('  curl http://localhost:3000/stats')
})

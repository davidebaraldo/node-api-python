#!/usr/bin/env node

/**
 * Scaffold a new node-api-python project.
 *
 * Usage:
 *   npx node-api-python init [project-name]
 *   npx node-api-python init [project-name] --template <template>
 *
 * Templates:
 *   basic      (default) Simple Python modules called from Node.js
 *   express    Express.js server with Python backend
 *   data       Data pipeline with pandas/numpy
 *   cli        CLI tool with Python core logic
 *   fullstack  TypeScript + Python with auto-generated types
 *   fastapi    FastAPI server managed from Node.js
 *   ml         ML inference with scikit-learn
 */

const fs = require('fs')
const path = require('path')

const COLORS = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

const TEMPLATES = {
  basic: {
    name: 'Basic',
    description: 'Simple Python modules called from Node.js',
    deps: {},
    devDeps: {},
    pythonDeps: [],
  },
  express: {
    name: 'Express API',
    description: 'Express.js server with Python ML backend',
    deps: { express: '^5.0.0' },
    devDeps: {},
    pythonDeps: [],
  },
  data: {
    name: 'Data Pipeline',
    description: 'Process data with pandas and numpy from Node.js',
    deps: {},
    devDeps: {},
    pythonDeps: ['pandas', 'numpy'],
  },
  cli: {
    name: 'CLI Tool',
    description: 'Command-line tool with Python core logic (sync calls)',
    deps: {},
    devDeps: {},
    pythonDeps: [],
  },
  fullstack: {
    name: 'Fullstack TypeScript',
    description: 'TypeScript + Python with auto-generated .d.ts types',
    deps: {},
    devDeps: { tsx: '^4.0.0', typescript: '^5.7.0' },
    pythonDeps: [],
  },
  fastapi: {
    name: 'FastAPI',
    description: 'FastAPI server managed and called from Node.js',
    deps: {},
    devDeps: {},
    pythonDeps: ['fastapi', 'uvicorn'],
  },
  ml: {
    name: 'ML Inference',
    description: 'Machine learning inference with scikit-learn from Node.js',
    deps: {},
    devDeps: {},
    pythonDeps: ['scikit-learn', 'numpy'],
  },
}

function printTemplates() {
  console.log('\n  Available templates:\n')
  for (const [key, t] of Object.entries(TEMPLATES)) {
    const marker = key === 'basic' ? ' (default)' : ''
    console.log(`    ${COLORS.cyan(key.padEnd(12))} ${t.description}${COLORS.dim(marker)}`)
  }
  console.log(`\n  Usage: npx node-api-python init my-project --template express\n`)
}

// --- Interactive prompt helper ---
function ask(question) {
  const readline = require('readline')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()) })
  })
}

async function interactiveInit() {
  console.log('')
  console.log(COLORS.bold('  node-api-python') + ' — project setup\n')

  const name = await ask('  Project name (my-python-addon): ')
  projectName = name || 'my-python-addon'

  console.log('\n  Available templates:\n')
  const keys = Object.keys(TEMPLATES)
  keys.forEach((key, i) => {
    const t = TEMPLATES[key]
    const marker = key === 'basic' ? ' (default)' : ''
    console.log(`    ${COLORS.cyan(`${i + 1})`)} ${key.padEnd(12)} ${t.description}${COLORS.dim(marker)}`)
  })
  console.log('')

  const choice = await ask(`  Choose template [1-${keys.length}] (1): `)
  const idx = parseInt(choice || '1') - 1
  if (idx >= 0 && idx < keys.length) {
    template = keys[idx]
  } else if (choice && keys.includes(choice)) {
    template = choice
  }
}

// --- Parse args ---
const args = process.argv.slice(3)
let projectName = 'my-python-addon'
let template = 'basic'
let interactive = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--template' || args[i] === '-t') {
    template = args[i + 1]
    i++
  } else if (args[i] === '--list') {
    printTemplates()
    process.exit(0)
  } else if (args[i] === '--interactive' || args[i] === '-i') {
    interactive = true
  } else if (!args[i].startsWith('-')) {
    projectName = args[i]
  }
}

// If no project name and no template specified, enter interactive mode
if (args.length === 0) {
  interactive = true
}

if (!interactive && !TEMPLATES[template]) {
  console.error(`\n  Unknown template: "${template}"`)
  printTemplates()
  process.exit(1)
}

// --- File generators per template ---

function createFile(relativePath, content) {
  const fullPath = path.join(path.resolve(process.cwd(), projectName), relativePath)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function makePackageJson(extra = {}) {
  const tmpl = TEMPLATES[template]
  const pkg = {
    name: projectName,
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'node index.js',
      types: 'npx node-api-python generate-types ./python/ -o ./types/',
      doctor: 'npx node-api-python doctor',
      ...extra.scripts,
    },
    dependencies: {
      'node-api-python': 'latest',
      ...tmpl.deps,
    },
    devDependencies: {
      ...tmpl.devDeps,
    },
  }
  if (Object.keys(pkg.devDependencies).length === 0) delete pkg.devDependencies
  return JSON.stringify(pkg, null, 2) + '\n'
}

const GITIGNORE = `node_modules/
types/
dist/
__pycache__/
*.pyc
.env
`

// ============================================================
// TEMPLATE: basic
// ============================================================
function generateBasic() {
  createFile('package.json', makePackageJson())
  createFile('.gitignore', GITIGNORE)

  createFile('index.js', `const python = require('node-api-python')

// Import Python modules
const math = python.import('./python/math_utils')
const text = python.import('./python/text_utils')

// --- Sync calls ---
console.log('=== Math ===')
console.log('2 + 3 =', math.addSync(2, 3))
console.log('5 * 4 =', math.multiplySync(5, 4))
console.log('fibonacci(10) =', math.fibonacciSync(10))

// --- Async calls ---
async function main() {
  console.log('\\n=== Text Processing ===')
  const words = await text.word_count('Hello world from Python!')
  console.log('Word count:', words)

  const slug = await text.slugify('Hello World From Python!')
  console.log('Slug:', slug)
}

main().catch(console.error)
`)

  createFile('python/math_utils.py', `"""Math utilities."""


def add(x: int, y: int) -> int:
    """Add two numbers."""
    return x + y


def multiply(x: float, y: float) -> float:
    """Multiply two numbers."""
    return x * y


def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    result = [0, 1]
    for _ in range(2, n):
        result.append(result[-1] + result[-2])
    return result
`)

  createFile('python/text_utils.py', `"""Text utilities."""
import re


def word_count(text: str) -> int:
    """Count words in a string."""
    return len(text.split())


def reverse_words(text: str) -> str:
    """Reverse word order."""
    return " ".join(text.split()[::-1])


def capitalize_words(text: str) -> str:
    """Capitalize each word."""
    return text.title()


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\\w\\s-]", "", text)
    text = re.sub(r"[\\s_]+", "-", text)
    return text
`)

  createFile('README.md', makeReadme('Run: `npm start`'))
}

// ============================================================
// TEMPLATE: express
// ============================================================
function generateExpress() {
  createFile('package.json', makePackageJson())
  createFile('.gitignore', GITIGNORE)

  createFile('index.js', `const express = require('express')
const python = require('node-api-python')

const app = express()
app.use(express.json())

const sentiment = python.import('./python/sentiment')
const tools = python.import('./python/tools')

// POST /analyze — Python sentiment analysis
app.post('/analyze', async (req, res) => {
  try {
    const result = await sentiment.analyze(req.body.text)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /summarize — Python text summarization
app.post('/summarize', async (req, res) => {
  try {
    const { text, max_length } = req.body
    const summary = await tools.summarize(text, max_length || 100)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /health — sync check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', python: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`)
  console.log('')
  console.log('Try:')
  console.log(\`  curl http://localhost:\${PORT}/analyze -X POST -H "Content-Type: application/json" -d '{"text":"I love this!"}'\`)
  console.log(\`  curl http://localhost:\${PORT}/health\`)
})
`)

  createFile('python/sentiment.py', `"""Sentiment analysis."""

POSITIVE = {"love", "great", "amazing", "excellent", "good", "happy", "wonderful", "fantastic", "best", "awesome"}
NEGATIVE = {"hate", "bad", "terrible", "awful", "worst", "horrible", "poor", "ugly", "boring"}


def analyze(text: str) -> dict[str, float | str]:
    """Analyze text sentiment. Returns score (-1 to 1), label, confidence."""
    words = set(text.lower().split())
    pos = len(words & POSITIVE)
    neg = len(words & NEGATIVE)
    total = pos + neg

    if total == 0:
        return {"score": 0.0, "label": "neutral", "confidence": 0.0}

    score = (pos - neg) / total
    confidence = min(total / len(words), 1.0) if words else 0.0
    label = "positive" if score > 0.1 else "negative" if score < -0.1 else "neutral"

    return {"score": round(score, 3), "label": label, "confidence": round(confidence, 3)}
`)

  createFile('python/tools.py', `"""Text tools."""


def summarize(text: str, max_length: int = 100) -> str:
    """Extract first N characters at a sentence boundary."""
    if len(text) <= max_length:
        return text
    truncated = text[:max_length]
    last_period = truncated.rfind(".")
    return truncated[:last_period + 1] if last_period > 0 else truncated.rstrip() + "..."
`)

  createFile('README.md', makeReadme(`
## Run

\\\`\\\`\\\`bash
npm start
\\\`\\\`\\\`

## Test

\\\`\\\`\\\`bash
curl http://localhost:3000/analyze -X POST -H "Content-Type: application/json" -d '{"text":"I love this product!"}'
curl http://localhost:3000/health
\\\`\\\`\\\`
`))
}

// ============================================================
// TEMPLATE: data
// ============================================================
function generateData() {
  createFile('package.json', makePackageJson())
  createFile('.gitignore', GITIGNORE)

  createFile('index.js', `const python = require('node-api-python')

const pipeline = python.import('./python/pipeline')

async function main() {
  // Send data from JS, process in Python, get results back
  const salesData = [
    { date: '2025-01-15', product: 'Widget A', quantity: 150, price: 29.99 },
    { date: '2025-01-15', product: 'Widget B', quantity: 80, price: 49.99 },
    { date: '2025-02-01', product: 'Widget A', quantity: 200, price: 29.99 },
    { date: '2025-02-01', product: 'Widget B', quantity: 120, price: 49.99 },
    { date: '2025-03-01', product: 'Widget A', quantity: 175, price: 31.99 },
  ]

  const summary = await pipeline.summarize_sales(salesData)
  console.log('Sales Summary:', JSON.stringify(summary, null, 2))

  // Numeric analysis
  const values = [23, 45, 12, 67, 34, 89, 11, 56, 78, 43]
  const stats = await pipeline.compute_statistics(values)
  console.log('\\nStatistics:', stats)

  // Zero-copy with TypedArray
  const arr = new Float64Array(1000).map(() => Math.random() * 100)
  const result = await pipeline.process_array(Array.from(arr))
  console.log('\\nProcessed 1000 elements:', result)
}

main().catch(console.error)
`)

  createFile('python/pipeline.py', `"""Data processing pipeline. Works with or without pandas/numpy."""
from __future__ import annotations

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def summarize_sales(data: list[dict]) -> dict:
    """Aggregate sales data by product."""
    products: dict[str, dict] = {}
    for row in data:
        name = row["product"]
        revenue = row["quantity"] * row["price"]
        if name not in products:
            products[name] = {"total_quantity": 0, "total_revenue": 0.0, "prices": []}
        products[name]["total_quantity"] += row["quantity"]
        products[name]["total_revenue"] += revenue
        products[name]["prices"].append(row["price"])

    result = {}
    for name, info in products.items():
        result[name] = {
            "total_quantity": info["total_quantity"],
            "total_revenue": round(info["total_revenue"], 2),
            "avg_price": round(sum(info["prices"]) / len(info["prices"]), 2),
        }

    total = sum(p["total_revenue"] for p in result.values())
    top = max(result, key=lambda k: result[k]["total_revenue"])
    return {"total_revenue": round(total, 2), "by_product": result, "top_product": top}


def compute_statistics(values: list[float]) -> dict[str, float]:
    """Compute descriptive statistics."""
    if HAS_NUMPY:
        arr = np.array(values, dtype=float)
        return {
            "mean": round(float(arr.mean()), 2),
            "median": round(float(np.median(arr)), 2),
            "std": round(float(arr.std()), 2),
            "min": float(arr.min()),
            "max": float(arr.max()),
        }
    sorted_v = sorted(values)
    n = len(sorted_v)
    mean = sum(values) / n
    var = sum((x - mean) ** 2 for x in values) / n
    med = sorted_v[n // 2] if n % 2 else (sorted_v[n // 2 - 1] + sorted_v[n // 2]) / 2
    return {"mean": round(mean, 2), "median": round(float(med), 2), "std": round(var**0.5, 2), "min": float(min(values)), "max": float(max(values))}


def process_array(data: list[float]) -> dict[str, float]:
    """Process a numeric array."""
    if HAS_NUMPY:
        arr = np.array(data)
        return {"sum": round(float(arr.sum()), 2), "mean": round(float(arr.mean()), 2), "std": round(float(arr.std()), 2), "count": len(data)}
    total = sum(data)
    mean = total / len(data)
    var = sum((x - mean) ** 2 for x in data) / len(data)
    return {"sum": round(total, 2), "mean": round(mean, 2), "std": round(var**0.5, 2), "count": len(data)}
`)

  createFile('README.md', makeReadme(`
## Setup

\\\`\\\`\\\`bash
pip install pandas numpy   # optional, works without them too
npm install
npm start
\\\`\\\`\\\`
`))
}

// ============================================================
// TEMPLATE: cli
// ============================================================
function generateCli() {
  createFile('package.json', makePackageJson({
    scripts: {
      start: 'node index.js --help',
    },
  }))
  createFile('.gitignore', GITIGNORE)

  createFile('index.js', `#!/usr/bin/env node
const python = require('node-api-python')

const tools = python.import('./python/tools')
const [,, command, ...args] = process.argv

switch (command) {
  case 'hash': {
    if (!args[0]) { console.error('Usage: cli hash <text>'); process.exit(1) }
    const r = tools.hash_textSync(args[0])
    console.log('MD5:   ', r.md5)
    console.log('SHA256:', r.sha256)
    break
  }
  case 'uuid': {
    const count = parseInt(args[0] || '1')
    tools.generate_uuidsSync(count).forEach((id) => console.log(id))
    break
  }
  case 'wc': {
    if (!args[0]) { console.error('Usage: cli wc <file>'); process.exit(1) }
    const r = tools.analyze_fileSync(args[0])
    console.log(\`Lines: \${r.lines}  Words: \${r.words}  Chars: \${r.characters}\`)
    break
  }
  default:
    console.log(\`
  ${projectName} — Python-powered CLI

  Commands:
    hash <text>    Compute MD5 and SHA256
    uuid [count]   Generate UUIDs
    wc <file>      Count lines/words/chars

  Examples:
    node index.js hash "hello world"
    node index.js uuid 5
    node index.js wc README.md
\`)
}
`)

  createFile('python/tools.py', `"""CLI tools — uses only Python standard library."""
import hashlib
import uuid
from collections import Counter


def hash_text(text: str) -> dict[str, str]:
    """Compute hashes of a string."""
    return {
        "md5": hashlib.md5(text.encode()).hexdigest(),
        "sha256": hashlib.sha256(text.encode()).hexdigest(),
    }


def generate_uuids(count: int = 1) -> list[str]:
    """Generate UUIDs."""
    return [str(uuid.uuid4()) for _ in range(count)]


def analyze_file(file_path: str) -> dict[str, int]:
    """Count lines, words, characters in a file."""
    with open(file_path, encoding="utf-8") as f:
        content = f.read()
    lines = content.count("\\n") + (1 if content and not content.endswith("\\n") else 0)
    words = len(content.split())
    return {"lines": lines, "words": words, "characters": len(content)}
`)

  createFile('README.md', makeReadme(`
## Run

\\\`\\\`\\\`bash
node index.js hash "hello world"
node index.js uuid 5
node index.js wc README.md
\\\`\\\`\\\`
`))
}

// ============================================================
// TEMPLATE: fullstack
// ============================================================
function generateFullstack() {
  createFile('package.json', makePackageJson({
    scripts: {
      start: 'npx tsx index.ts',
      types: 'npx node-api-python generate-types ./python/ -o ./types/',
    },
  }))
  createFile('.gitignore', GITIGNORE)
  createFile('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'commonjs',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: 'dist',
    },
    include: ['*.ts', 'types/'],
  }, null, 2) + '\n')

  createFile('index.ts', `import python from 'node-api-python'
import type { UserEvent, AnalyticsReport } from './types/analytics'

const analytics = python.import('./python/analytics')

async function main() {
  const events: UserEvent[] = [
    { user_id: 'u1', action: 'click', page: '/home', timestamp: Date.now() },
    { user_id: 'u1', action: 'scroll', page: '/home', timestamp: Date.now() + 1000 },
    { user_id: 'u2', action: 'click', page: '/about', timestamp: Date.now() + 2000 },
    { user_id: 'u1', action: 'click', page: '/pricing', timestamp: Date.now() + 3000 },
  ]

  // Full type safety — IDE knows argument and return types
  const report: AnalyticsReport = await analytics.generate_report(events)

  console.log('Analytics Report:')
  console.log(\`  Users:  \${report.unique_users}\`)
  console.log(\`  Events: \${report.total_events}\`)
  console.log(\`  Top:    \${report.top_page}\`)
  console.log(\`  Actions:\`, report.by_action)
}

main().catch(console.error)
`)

  createFile('python/analytics.py', `"""Analytics — fully typed for TypeScript generation."""
from __future__ import annotations
from dataclasses import dataclass
from typing import TypedDict


class UserEvent(TypedDict):
    user_id: str
    action: str
    page: str
    timestamp: float


@dataclass
class AnalyticsReport:
    unique_users: int
    total_events: int
    top_page: str
    by_action: dict[str, int]
    by_page: dict[str, int]


def generate_report(events: list[UserEvent]) -> AnalyticsReport:
    """Generate analytics report from events."""
    users = set()
    by_action: dict[str, int] = {}
    by_page: dict[str, int] = {}

    for e in events:
        users.add(e["user_id"])
        by_action[e["action"]] = by_action.get(e["action"], 0) + 1
        by_page[e["page"]] = by_page.get(e["page"], 0) + 1

    top = max(by_page, key=by_page.get) if by_page else ""
    return AnalyticsReport(
        unique_users=len(users), total_events=len(events),
        top_page=top, by_action=by_action, by_page=by_page,
    )
`)

  createFile('types/analytics.d.ts', `/**
 * Auto-generated from python/analytics.py
 * Regenerate: npm run types
 */

export interface UserEvent {
  user_id: string
  action: string
  page: string
  timestamp: number
}

export interface AnalyticsReport {
  unique_users: number
  total_events: number
  top_page: string
  by_action: Record<string, number>
  by_page: Record<string, number>
}

export function generate_report(events: UserEvent[]): Promise<AnalyticsReport>
`)

  createFile('README.md', makeReadme(`
## Run

\\\`\\\`\\\`bash
npm start
\\\`\\\`\\\`

## Regenerate types

\\\`\\\`\\\`bash
npm run types
\\\`\\\`\\\`

Python \\\`TypedDict\\\` and \\\`@dataclass\\\` become TypeScript \\\`interface\\\` automatically.
`))
}

// ============================================================
// TEMPLATE: fastapi
// ============================================================
function generateFastapi() {
  createFile('package.json', makePackageJson())
  createFile('.gitignore', GITIGNORE)

  createFile('index.js', `const { execSync, spawn } = require('child_process')
const python = require('node-api-python')

const api = python.import('./python/api')

// Start FastAPI server via uvicorn in background
const PORT = process.env.PORT || 8000

console.log(\`Starting FastAPI server on http://localhost:\${PORT}...\`)

const uvicorn = spawn('python', ['-m', 'uvicorn', 'python.api:app', '--port', String(PORT)], {
  stdio: 'inherit',
  cwd: __dirname,
})

uvicorn.on('error', (err) => {
  console.error('Failed to start uvicorn:', err.message)
  console.error('Make sure uvicorn is installed: pip install uvicorn fastapi')
  process.exit(1)
})

// Also call Python functions directly (in-process, no HTTP)
setTimeout(async () => {
  console.log('\\n--- Direct in-process calls (no HTTP overhead) ---')

  const items = api.list_itemsSync()
  console.log('Items:', items)

  const created = api.create_itemSync({ name: 'Widget', price: 29.99, in_stock: true })
  console.log('Created:', created)

  const stats = api.get_statsSync()
  console.log('Stats:', stats)
  console.log('')
  console.log('FastAPI is also running — try:')
  console.log(\`  curl http://localhost:\${PORT}/items\`)
  console.log(\`  curl http://localhost:\${PORT}/docs  (Swagger UI)\`)
}, 2000)

process.on('SIGINT', () => { uvicorn.kill(); process.exit(0) })
process.on('SIGTERM', () => { uvicorn.kill(); process.exit(0) })
`)

  createFile('python/__init__.py', '')

  createFile('python/api.py', `"""FastAPI application — callable from both HTTP and Node.js in-process."""
from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="${projectName}", version="1.0.0")


class Item(BaseModel):
    name: str
    price: float
    in_stock: bool = True


# In-memory store
_items: list[dict] = [
    {"id": 1, "name": "Gadget", "price": 19.99, "in_stock": True},
    {"id": 2, "name": "Gizmo", "price": 49.99, "in_stock": False},
]
_next_id = 3


# --- HTTP endpoints ---

@app.get("/items")
def http_list_items() -> list[dict]:
    return _items


@app.post("/items")
def http_create_item(item: Item) -> dict:
    return create_item(item.model_dump())


@app.get("/stats")
def http_stats() -> dict:
    return get_stats()


# --- Functions callable directly from Node.js (no HTTP) ---

def list_items() -> list[dict]:
    """List all items."""
    return _items


def create_item(data: dict) -> dict:
    """Create a new item. Returns the created item with ID."""
    global _next_id
    item = {"id": _next_id, **data}
    _items.append(item)
    _next_id += 1
    return item


def get_stats() -> dict[str, int | float]:
    """Get inventory statistics."""
    total = len(_items)
    in_stock = sum(1 for i in _items if i.get("in_stock", False))
    avg_price = sum(i["price"] for i in _items) / total if total else 0
    return {"total_items": total, "in_stock": in_stock, "avg_price": round(avg_price, 2)}
`)

  createFile('README.md', makeReadme(`
## Run

\\\`\\\`\\\`bash
pip install fastapi uvicorn
npm start
\\\`\\\`\\\`

This starts FastAPI (HTTP on port 8000) AND calls Python functions directly from Node.js.

- **HTTP:** \\\`curl http://localhost:8000/items\\\`
- **Swagger UI:** http://localhost:8000/docs
- **In-process:** Node.js calls Python functions directly, no network overhead
`))
}

// ============================================================
// TEMPLATE: ml
// ============================================================
function generateMl() {
  createFile('package.json', makePackageJson())
  createFile('.gitignore', GITIGNORE + 'models/\n')

  createFile('index.js', `const python = require('node-api-python')

const ml = python.import('./python/model')

async function main() {
  console.log('=== ML Inference with scikit-learn ===\\n')

  // Train a model on sample data
  console.log('Training model...')
  const metrics = await ml.train()
  console.log('Training complete:', metrics)

  // Run predictions
  console.log('\\nPredictions:')
  const samples = [
    { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 },
    { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4 },
    { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5 },
  ]

  for (const sample of samples) {
    const result = await ml.predict(sample)
    console.log(\`  \${JSON.stringify(sample)} => \${result.species} (\${(result.confidence * 100).toFixed(1)}%)\`)
  }

  // Batch predictions
  console.log('\\nBatch prediction:')
  const batch = await ml.predict_batch(samples)
  console.log(\`  \${batch.length} predictions:\`, batch.map(r => r.species))

  // Model info
  const info = await ml.model_info()
  console.log('\\nModel info:', info)
}

main().catch(console.error)
`)

  createFile('python/model.py', `"""ML model — train and predict using scikit-learn."""
from __future__ import annotations

import numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Module-level model (persists across calls)
_model: RandomForestClassifier | None = None
_target_names: list[str] = []
_feature_names: list[str] = ["sepal_length", "sepal_width", "petal_length", "petal_width"]


def train(test_size: float = 0.2, n_estimators: int = 100) -> dict[str, float]:
    """Train a RandomForest on the Iris dataset. Returns metrics."""
    global _model, _target_names

    iris = load_iris()
    _target_names = list(iris.target_names)

    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=test_size, random_state=42,
    )

    _model = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
    _model.fit(X_train, y_train)

    y_pred = _model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    return {
        "accuracy": round(float(accuracy), 4),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "n_estimators": n_estimators,
    }


def predict(sample: dict[str, float]) -> dict[str, str | float]:
    """Predict species for a single sample."""
    if _model is None:
        train()

    features = np.array([[sample[f] for f in _feature_names]])
    prediction = int(_model.predict(features)[0])
    probabilities = _model.predict_proba(features)[0]

    return {
        "species": _target_names[prediction],
        "confidence": round(float(probabilities[prediction]), 4),
        "probabilities": {name: round(float(p), 4) for name, p in zip(_target_names, probabilities)},
    }


def predict_batch(samples: list[dict[str, float]]) -> list[dict[str, str | float]]:
    """Predict species for multiple samples."""
    return [predict(s) for s in samples]


def model_info() -> dict[str, str | int | list[str]]:
    """Return model metadata."""
    if _model is None:
        return {"status": "not trained"}

    return {
        "status": "trained",
        "type": "RandomForestClassifier",
        "n_estimators": _model.n_estimators,
        "features": _feature_names,
        "classes": _target_names,
    }
`)

  createFile('README.md', makeReadme(`
## Run

\\\`\\\`\\\`bash
pip install scikit-learn numpy
npm start
\\\`\\\`\\\`

This trains a RandomForest classifier on the Iris dataset and runs predictions from Node.js.

The model persists in memory — train once, predict many times with zero overhead.
`))
}

// ============================================================
// Shared README generator
// ============================================================
function makeReadme(extra = '') {
  const tmpl = TEMPLATES[template]
  const pipDeps = tmpl.pythonDeps.length > 0 ? `pip install ${tmpl.pythonDeps.join(' ')}\n` : ''

  return `# ${projectName}

${tmpl.description}. Built with [node-api-python](https://github.com/davidebaraldo/node-api-python).

## Setup

\`\`\`bash
npm install
${pipDeps}npx node-api-python doctor   # verify your environment
\`\`\`

${extra.replace(/\\\\/g, '')}

## Add a new Python module

1. Create a \`.py\` file in the \`python/\` folder
2. Add type hints to your functions
3. Import it: \`const mod = python.import('./python/my_module')\`
4. Regenerate types: \`npm run types\`
`
}

// ============================================================
// Run
// ============================================================

async function run() {
  if (interactive) {
    await interactiveInit()
  }

  // Re-resolve projectDir after potential interactive change
  const resolvedDir = path.resolve(process.cwd(), projectName)

  if (fs.existsSync(resolvedDir)) {
    console.error(`\n  Directory "${projectName}" already exists.\n`)
    process.exit(1)
  }

  console.log('')
  console.log(COLORS.bold(`  Creating ${projectName}`) + COLORS.dim(` (template: ${template})`))
  console.log('')

  const generators = {
    basic: generateBasic,
    express: generateExpress,
    data: generateData,
    cli: generateCli,
    fullstack: generateFullstack,
    fastapi: generateFastapi,
    ml: generateMl,
  }

  generators[template]()

  const tmpl = TEMPLATES[template]

  console.log(COLORS.green('  Done!') + ' Project created at ' + COLORS.cyan(resolvedDir))
  console.log('')
  console.log('  Next steps:')
  console.log('')
  console.log(COLORS.dim(`    cd ${projectName}`))
  console.log(COLORS.dim('    npm install'))
  if (tmpl.pythonDeps.length > 0) {
    console.log(COLORS.dim(`    pip install ${tmpl.pythonDeps.join(' ')}`))
  }
  console.log(COLORS.dim('    npx node-api-python doctor'))
  console.log(COLORS.dim('    npm start'))
  console.log('')
  console.log('  Add your Python modules in the ' + COLORS.cyan('python/') + ' folder.')
  console.log('')
}

run().catch((err) => { console.error(err); process.exit(1) })

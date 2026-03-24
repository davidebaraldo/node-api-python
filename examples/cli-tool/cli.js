#!/usr/bin/env node

/**
 * Example: CLI Tool — Node.js CLI with Python core logic
 *
 * Run:   node examples/cli-tool/cli.js analyze data.csv
 *        node examples/cli-tool/cli.js convert input.json output.yaml
 *        node examples/cli-tool/cli.js hash "hello world"
 *
 * Shows: sync Python calls in a CLI context, no async needed
 */

const python = require('node-api-python')

const tools = python.import('./examples/cli-tool/tools')

const [,, command, ...args] = process.argv

switch (command) {
  case 'hash': {
    const input = args[0]
    if (!input) {
      console.error('Usage: cli hash <text>')
      process.exit(1)
    }
    // Sync call — CLI doesn't need async
    const result = tools.hash_textSync(input)
    console.log(`MD5:    ${result.md5}`)
    console.log(`SHA256: ${result.sha256}`)
    break
  }

  case 'analyze': {
    const filePath = args[0]
    if (!filePath) {
      console.error('Usage: cli analyze <file>')
      process.exit(1)
    }
    const result = tools.analyze_fileSync(filePath)
    console.log(`File: ${filePath}`)
    console.log(`Lines: ${result.lines}`)
    console.log(`Words: ${result.words}`)
    console.log(`Characters: ${result.characters}`)
    console.log(`Top words: ${JSON.stringify(result.top_words)}`)
    break
  }

  case 'uuid': {
    const count = parseInt(args[0] || '1')
    const uuids = tools.generate_uuidsSync(count)
    uuids.forEach((id) => console.log(id))
    break
  }

  case 'json-to-yaml': {
    const input = args[0]
    if (!input) {
      console.error('Usage: cli json-to-yaml <json-string>')
      process.exit(1)
    }
    console.log(tools.json_to_yamlSync(input))
    break
  }

  default:
    console.log(`
  Python-powered CLI Tool

  Commands:
    hash <text>            Compute MD5 and SHA256 hashes
    analyze <file>         Analyze a text file (lines, words, top words)
    uuid [count]           Generate UUIDs
    json-to-yaml <json>    Convert JSON to YAML format

  Examples:
    node cli.js hash "hello world"
    node cli.js analyze README.md
    node cli.js uuid 5
    node cli.js json-to-yaml '{"name": "test", "value": 42}'
`)
}

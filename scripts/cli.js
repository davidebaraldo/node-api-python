#!/usr/bin/env node

/**
 * CLI entry point for node-api-python.
 *
 * Commands:
 *   doctor          Check your environment
 *   generate-types  Generate .d.ts from Python type hints
 *   find-python     Show detected Python installation
 */

const command = process.argv[2]

switch (command) {
  case 'init':
    require('./init')
    break

  case 'doctor':
    require('./doctor')
    break

  case 'generate-types':
    require('./generate-types')
    break

  case 'find-python':
    require('./find-python')
    break

  case '--help':
  case '-h':
  case undefined:
    console.log(`
  node-api-python — High-performance Node.js ↔ Python bridge

  Commands:
    init [name]     Create a new project with Python modules ready to go
    doctor          Check your environment is ready
    generate-types  Generate .d.ts from Python type hints
    find-python     Show detected Python installation

  Usage:
    npx node-api-python init my-project
    npx node-api-python doctor
    npx node-api-python generate-types ./module.py -o ./types/
    npx node-api-python find-python
`)
    break

  default:
    console.error(`  Unknown command: ${command}`)
    console.error(`  Run "npx node-api-python --help" for available commands.`)
    process.exit(1)
}

#!/usr/bin/env node

/**
 * Diagnostic tool for node-api-python.
 * Usage: npx node-api-python doctor
 *
 * Checks everything needed to build and run the bridge:
 *   - Node.js version
 *   - Python version and location
 *   - Python dev headers
 *   - pybind11
 *   - CMake
 *   - C++ compiler
 *   - numpy (optional)
 */

const { execSync } = require('child_process')
const { findPython } = require('./find-python')

const COLORS = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

const OK = COLORS.green('OK')
const FAIL = COLORS.red('FAIL')
const WARN = COLORS.yellow('WARN')

let hasErrors = false

function check(label, fn) {
  try {
    const result = fn()
    if (result.ok) {
      console.log(`  ${OK}   ${label}  ${COLORS.dim(result.detail || '')}`)
    } else if (result.warn) {
      console.log(`  ${WARN} ${label}  ${COLORS.yellow(result.detail || '')}`)
    } else {
      hasErrors = true
      console.log(`  ${FAIL} ${label}  ${COLORS.red(result.detail || '')}`)
      if (result.fix) {
        console.log(`        ${COLORS.dim('Fix:')} ${result.fix}`)
      }
    }
  } catch (e) {
    hasErrors = true
    console.log(`  ${FAIL} ${label}  ${COLORS.red(e.message)}`)
  }
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

console.log('')
console.log(COLORS.bold('  node-api-python doctor'))
console.log(COLORS.dim('  ' + '─'.repeat(40)))
console.log('')

// Node.js
check('Node.js', () => {
  const v = process.versions.node
  const major = parseInt(v.split('.')[0])
  if (major >= 22) return { ok: true, detail: `v${v}` }
  return { ok: false, detail: `v${v} (need >= 22)`, fix: 'Install Node.js 22+ from https://nodejs.org' }
})

// Python
const python = findPython()
check('Python', () => {
  if (!python) return { ok: false, detail: 'not found', fix: 'Install Python 3.10+' }
  return { ok: true, detail: `${python.version.string} via ${python.source}` }
})

check('Python dev headers', () => {
  if (!python) return { ok: false, detail: 'Python not found' }
  if (python.devHeaders) return { ok: true }
  return {
    ok: false,
    detail: 'Python.h not found',
    fix: process.platform === 'linux'
      ? 'sudo apt install python3-dev (Ubuntu) or sudo dnf install python3-devel (Fedora)'
      : 'Reinstall Python with development headers',
  }
})

check('pybind11', () => {
  if (!python) return { ok: false, detail: 'Python not found' }
  if (python.pybind11) return { ok: true }
  return { ok: false, detail: 'not installed', fix: 'pip install pybind11' }
})

check('numpy', () => {
  if (!python) return { warn: true, detail: 'Python not found' }
  if (python.numpy) return { ok: true }
  return { warn: true, detail: 'not installed (optional, needed for zero-copy arrays)' }
})

// CMake
check('CMake', () => {
  const version = run('cmake --version')
  if (!version) {
    return {
      ok: false,
      detail: 'not found',
      fix: process.platform === 'win32'
        ? 'winget install Kitware.CMake'
        : process.platform === 'darwin'
          ? 'brew install cmake'
          : 'sudo apt install cmake',
    }
  }
  const match = version.match(/(\d+\.\d+\.\d+)/)
  return { ok: true, detail: match ? `v${match[1]}` : '' }
})

// C++ compiler
check('C++ compiler', () => {
  if (process.platform === 'win32') {
    const cl = run('where cl.exe')
    if (cl) return { ok: true, detail: 'MSVC (cl.exe)' }
    return {
      ok: false,
      detail: 'cl.exe not found',
      fix: 'Install "Desktop development with C++" from Visual Studio Installer, or run from Developer Command Prompt',
    }
  }

  const gpp = run('g++ --version') || run('clang++ --version')
  if (gpp) {
    const match = gpp.match(/(g\+\+|clang).*?(\d+\.\d+)/)
    return { ok: true, detail: match ? `${match[1]} ${match[2]}` : 'found' }
  }

  return {
    ok: false,
    detail: 'not found',
    fix: process.platform === 'darwin'
      ? 'xcode-select --install'
      : 'sudo apt install build-essential',
  }
})

console.log('')

if (hasErrors) {
  console.log(COLORS.red('  Some checks failed. Fix the issues above and run again:'))
  console.log(COLORS.dim('    npx node-api-python doctor'))
} else {
  console.log(COLORS.green('  All checks passed! You\'re ready to go.'))
  console.log(COLORS.dim('    npm run build'))
}

console.log('')
process.exit(hasErrors ? 1 : 0)

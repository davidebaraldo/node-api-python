#!/usr/bin/env node

/**
 * Auto-detect Python installation.
 *
 * Resolution order:
 *   1. NODE_API_PYTHON_PATH env var (explicit override)
 *   2. Active virtualenv (VIRTUAL_ENV env var)
 *   3. conda env (CONDA_PREFIX env var)
 *   4. pyenv (pyenv which python3)
 *   5. System PATH (python3, python)
 *
 * Validates:
 *   - Python version is 3.10 — 3.14
 *   - Python development headers are available
 *   - pybind11 is installed
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const MIN_VERSION = [3, 10]
const MAX_VERSION = [3, 14]

const COLORS = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

function getPythonVersion(pythonPath) {
  const output = run(`"${pythonPath}" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"`)
  if (!output) return null
  const parts = output.split('.').map(Number)
  return { major: parts[0], minor: parts[1], micro: parts[2], string: output }
}

function isVersionSupported(version) {
  if (!version) return false
  const v = [version.major, version.minor]
  return (
    (v[0] > MIN_VERSION[0] || (v[0] === MIN_VERSION[0] && v[1] >= MIN_VERSION[1])) &&
    (v[0] < MAX_VERSION[0] || (v[0] === MAX_VERSION[0] && v[1] <= MAX_VERSION[1]))
  )
}

function hasDevHeaders(pythonPath) {
  const result = run(`"${pythonPath}" -c "import sysconfig; print(sysconfig.get_path('include'))"`)
  if (!result) return false
  try {
    return fs.existsSync(path.join(result, 'Python.h'))
  } catch {
    return false
  }
}

function hasPybind11(pythonPath) {
  return run(`"${pythonPath}" -c "import pybind11; print(pybind11.get_cmake_dir())"`) !== null
}

function hasNumpy(pythonPath) {
  return run(`"${pythonPath}" -c "import numpy; print(numpy.__version__)"`) !== null
}

function findPythonCandidates() {
  const candidates = []

  // 1. Explicit override
  if (process.env.NODE_API_PYTHON_PATH) {
    candidates.push({
      path: process.env.NODE_API_PYTHON_PATH,
      source: 'NODE_API_PYTHON_PATH env var',
    })
  }

  // 2. Active virtualenv
  if (process.env.VIRTUAL_ENV) {
    const isWin = process.platform === 'win32'
    const venvPython = path.join(process.env.VIRTUAL_ENV, isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python3')
    candidates.push({ path: venvPython, source: `virtualenv (${process.env.VIRTUAL_ENV})` })
  }

  // 3. Conda
  if (process.env.CONDA_PREFIX) {
    const isWin = process.platform === 'win32'
    const condaPython = path.join(process.env.CONDA_PREFIX, isWin ? 'python.exe' : 'bin/python3')
    candidates.push({ path: condaPython, source: `conda (${process.env.CONDA_PREFIX})` })
  }

  // 4. pyenv
  const pyenvPython = run('pyenv which python3')
  if (pyenvPython) {
    candidates.push({ path: pyenvPython, source: 'pyenv' })
  }

  // 5. System PATH
  const isWin = process.platform === 'win32'
  const whichCmd = isWin ? 'where' : 'which'

  for (const name of ['python3', 'python']) {
    const found = run(`${whichCmd} ${name}`)
    if (found) {
      const pythonPath = found.split('\n')[0].trim()
      candidates.push({ path: pythonPath, source: 'PATH' })
    }
  }

  return candidates
}

function findPython() {
  const candidates = findPythonCandidates()

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.path)) continue

    const version = getPythonVersion(candidate.path)
    if (!version) continue
    if (!isVersionSupported(version)) continue

    return {
      path: candidate.path,
      version,
      source: candidate.source,
      devHeaders: hasDevHeaders(candidate.path),
      pybind11: hasPybind11(candidate.path),
      numpy: hasNumpy(candidate.path),
    }
  }

  return null
}

function printResult(result) {
  if (!result) {
    console.error(COLORS.red('\n  Python not found or unsupported version.\n'))
    console.error(`  node-api-python requires Python ${MIN_VERSION.join('.')} — ${MAX_VERSION.join('.')}.\n`)
    console.error('  Install Python:')
    console.error('    Windows:  winget install Python.Python.3.13')
    console.error('    macOS:    brew install python@3.13')
    console.error('    Ubuntu:   sudo apt install python3-dev python3-pip')
    console.error('    Fedora:   sudo dnf install python3-devel python3-pip')
    console.error('')
    console.error('  Or set NODE_API_PYTHON_PATH to your Python executable.\n')
    process.exit(1)
  }

  const ok = COLORS.green('OK')
  const missing = COLORS.yellow('MISSING')

  console.log('')
  console.log(COLORS.bold('  node-api-python — Python Environment'))
  console.log(COLORS.dim('  ' + '─'.repeat(40)))
  console.log(`  Python:      ${ok}  ${result.version.string} (${result.source})`)
  console.log(`  Path:        ${COLORS.dim(result.path)}`)
  console.log(`  Dev headers: ${result.devHeaders ? ok : missing}`)
  console.log(`  pybind11:    ${result.pybind11 ? ok : missing}`)
  console.log(`  numpy:       ${result.numpy ? ok : COLORS.dim('not installed (optional)')}`)

  if (!result.devHeaders || !result.pybind11) {
    console.log('')
    console.log(COLORS.yellow('  Missing dependencies. Install them:'))
    if (!result.devHeaders) {
      console.log('')
      console.log('  Python dev headers:')
      console.log('    Windows:  included with Python installer (check "Install dev files")')
      console.log('    macOS:    included with Homebrew Python')
      console.log('    Ubuntu:   sudo apt install python3-dev')
      console.log('    Fedora:   sudo dnf install python3-devel')
    }
    if (!result.pybind11) {
      console.log('')
      console.log('  pybind11:')
      console.log(`    pip install pybind11`)
    }
  }

  console.log('')

  return result
}

// Export for programmatic use
module.exports = { findPython, findPythonCandidates, getPythonVersion, isVersionSupported }

// CLI
if (require.main === module) {
  const result = findPython()
  printResult(result)

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2))
  }
}

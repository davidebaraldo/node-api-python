#!/usr/bin/env node

/**
 * Postinstall script — runs after `npm install`.
 *
 * 1. Check for prebuilt binary in prebuilds/<platform>-<arch>/
 * 2. If found, copy it to build/Release/node_api_python.node
 * 3. If not found, attempt to build from source via cmake-js
 * 4. Give clear, colored error messages if build fails
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ADDON_NAME = 'node_api_python'

const COLORS = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

function findPrebuild() {
  const platform = process.platform   // win32, darwin, linux
  const arch = process.arch           // x64, arm64
  const tag = `${platform}-${arch}`

  // Check in prebuilds/ directory
  const prebuildsDir = path.join(__dirname, '..', 'prebuilds', tag)
  if (fs.existsSync(prebuildsDir)) {
    // Find the .node file
    const files = fs.readdirSync(prebuildsDir)
    const nodeFile = files.find(f => f.endsWith('.node'))
    if (nodeFile) return path.join(prebuildsDir, nodeFile)
  }
  return null
}

function installPrebuild(prebuildPath) {
  const targetDir = path.join(__dirname, '..', 'build', 'Release')
  fs.mkdirSync(targetDir, { recursive: true })
  const target = path.join(targetDir, `${ADDON_NAME}.node`)
  fs.copyFileSync(prebuildPath, target)
  return true
}

function buildFromSource() {
  console.log(COLORS.yellow('  node-api-python: no prebuilt binary found, building from source...'))
  console.log('')
  try {
    execSync('npx cmake-js compile', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    })
    return true
  } catch {
    return false
  }
}

// --- Main ---

const prebuildPath = findPrebuild()

if (prebuildPath) {
  // Fast path: copy prebuilt binary to build/Release/
  try {
    installPrebuild(prebuildPath)
    const tag = `${process.platform}-${process.arch}`
    console.log(COLORS.green(`  node-api-python: installed prebuilt binary for ${tag}`))
    process.exit(0)
  } catch (err) {
    console.log(COLORS.yellow(`  node-api-python: found prebuilt but copy failed: ${err.message}`))
    console.log(COLORS.dim('  Falling back to source build...'))
  }
}

// Slow path: build from source
if (buildFromSource()) {
  console.log(COLORS.green('  node-api-python: built from source successfully'))
  process.exit(0)
}

// Build failed — give helpful error
console.error('')
console.error(COLORS.red('  node-api-python: failed to build native addon'))
console.error('')
console.error('  Make sure you have:')
console.error('    - Python 3.10+ with dev headers')
console.error('    - CMake 3.15+')
console.error('    - C++ compiler (MSVC / GCC / Clang)')
console.error('    - pybind11 (pip install pybind11)')
console.error('')
console.error(COLORS.dim('  Run "npx node-api-python doctor" to check your environment.'))
console.error('')
process.exit(1)

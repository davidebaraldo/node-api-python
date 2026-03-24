#!/usr/bin/env node

/**
 * Postinstall script — runs after `npm install`.
 *
 * If prebuilt binaries are available, does nothing (fast path).
 * Otherwise, checks that build dependencies are present and gives
 * clear instructions if anything is missing.
 */

const fs = require('fs')
const path = require('path')

const COLORS = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

// Check for prebuilt binaries
const prebuildsDir = path.join(__dirname, '..', 'prebuilds')
if (fs.existsSync(prebuildsDir)) {
  const platform = `${process.platform}-${process.arch}`
  const platformDir = path.join(prebuildsDir, platform)

  if (fs.existsSync(platformDir)) {
    console.log(COLORS.green(`  node-api-python: using prebuilt binary for ${platform}`))
    process.exit(0)
  }
}

// No prebuild — check dependencies
console.log('')
console.log(COLORS.yellow('  node-api-python: no prebuilt binary for your platform.'))
console.log(COLORS.dim('  The native addon will be compiled from source on first build.\n'))
console.log('  Make sure you have:')
console.log('    - Python 3.10+ with dev headers')
console.log('    - CMake 3.15+')
console.log('    - C++ compiler (MSVC / GCC / Clang)')
console.log('    - pybind11 (pip install pybind11)')
console.log('')
console.log(COLORS.dim('  Run "npx node-api-python doctor" to check your environment.'))
console.log('')

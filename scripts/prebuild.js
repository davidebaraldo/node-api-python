#!/usr/bin/env node

/**
 * Build prebuilt binaries for the current platform.
 * Usage: node scripts/prebuild.js
 *
 * Creates: prebuilds/<platform>-<arch>/node_api_python.node
 *
 * This script is for maintainers. End users get prebuilts from npm.
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

const platform = process.platform
const arch = process.arch
const tag = `${platform}-${arch}`

const rootDir = path.join(__dirname, '..')
const prebuildsDir = path.join(rootDir, 'prebuilds', tag)
const buildArtifact = path.join(rootDir, 'build', 'Release', `${ADDON_NAME}.node`)

console.log(`  Building prebuilt binary for ${tag}...`)
console.log('')

// Step 1: Build from source
try {
  execSync('npx cmake-js compile', {
    cwd: rootDir,
    stdio: 'inherit',
  })
} catch (err) {
  console.error(COLORS.red(`  Build failed. Run "npx node-api-python doctor" to diagnose.`))
  process.exit(1)
}

// Step 2: Verify the artifact exists
if (!fs.existsSync(buildArtifact)) {
  console.error(COLORS.red(`  Build completed but artifact not found at:`))
  console.error(COLORS.dim(`  ${buildArtifact}`))
  process.exit(1)
}

// Step 3: Copy to prebuilds/
fs.mkdirSync(prebuildsDir, { recursive: true })
const target = path.join(prebuildsDir, `${ADDON_NAME}.node`)
fs.copyFileSync(buildArtifact, target)

const size = fs.statSync(target).size
const sizeKB = (size / 1024).toFixed(0)

console.log('')
console.log(COLORS.green(`  Prebuild created successfully`))
console.log(COLORS.dim(`  ${target} (${sizeKB} KB)`))
console.log('')

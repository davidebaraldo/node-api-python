import type { NativeAddon } from './module'
import type { ImportOptions, PythonModule } from './types'

export type {
  ImportOptions,
  PythonModule,
  PythonError,
  PythonTracebackFrame,
  PyInt,
  PyFloat,
  PyStr,
  PyBool,
  PyNone,
  PyList,
  PyDict,
  PyBytes,
  PySet,
  PyTuple,
} from './types'

import * as path from 'path'

interface FullAddon extends NativeAddon {
  import(path: string): unknown
  version(): string
  isInitialized(): boolean
  setSysPath?(paths: string[]): void
  setPythonPath?(pythonPath: string): void
}

// Resolve project root (works from both lib/ and dist/)
const projectRoot = path.resolve(__dirname, '..')

function loadAddon(): FullAddon {
  const addonPaths = [
    path.join(projectRoot, 'build', 'Release', 'node_api_python.node'),
    path.join(projectRoot, 'build', 'Debug', 'node_api_python.node'),
    path.join(projectRoot, 'prebuilds', `${process.platform}-${process.arch}`, 'node_api_python.node'),
  ]

  for (const p of addonPaths) {
    try {
      return require(p)
    } catch {
      // try next
    }
  }

  throw new Error(
    'Failed to load node-api-python native addon. ' +
    'Run "npm run build" to compile, or run "npx node-api-python doctor" to diagnose.',
  )
}

const addon: FullAddon = loadAddon()

function importModule(modulePath: string, options?: ImportOptions): PythonModule {
  if (options?.pythonPath && addon.setPythonPath) {
    addon.setPythonPath(options.pythonPath)
  }

  if (options?.paths && addon.setSysPath) {
    addon.setSysPath(options.paths)
  }

  let nativeModule: unknown
  try {
    nativeModule = addon.import(modulePath)
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to import Python module "${modulePath}": ${err.message}`)
    }
    throw err
  }

  // The native addon's BuildModuleProxy already creates a JS object with
  // func() (async) and funcSync() (sync) for each callable attribute
  return nativeModule as PythonModule
}

const version: string = (() => {
  try {
    return addon.version()
  } catch {
    return 'unknown'
  }
})()

const isInitialized: boolean = (() => {
  try {
    return addon.isInitialized()
  } catch {
    return false
  }
})()

export { importModule, importModule as import, version, isInitialized }

const publicApi = {
  import: importModule,
  importModule,
  version,
  isInitialized,
}

module.exports = publicApi
module.exports.default = publicApi
module.exports.__esModule = true

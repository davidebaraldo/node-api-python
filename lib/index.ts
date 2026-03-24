import { PythonModuleProxy } from './module'
import type { NativeAddon } from './module'
import type { ImportOptions, PythonModule } from './types'

export type {
  ImportOptions,
  PythonModule,
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

interface FullAddon extends NativeAddon {
  importModule(path: string): unknown
  getVersion(): string
  isInitialized(): boolean
  setSysPath?(paths: string[]): void
  setPythonPath?(pythonPath: string): void
}

let addon: FullAddon

try {
  addon = require('../build/Release/node_api_python.node')
} catch {
  try {
    addon = require('../prebuilds/' +
      process.platform + '-' + process.arch +
      '/node_api_python.node')
  } catch {
    throw new Error(
      'Failed to load node-api-python native addon. ' +
      'Run "npm run build" to compile, or run "npx node-api-python doctor" to diagnose.',
    )
  }
}

function importModule(modulePath: string, options?: ImportOptions): PythonModule {
  if (options?.pythonPath && addon.setPythonPath) {
    addon.setPythonPath(options.pythonPath)
  }

  if (options?.paths && addon.setSysPath) {
    addon.setSysPath(options.paths)
  }

  let nativeModule: unknown
  try {
    nativeModule = addon.importModule(modulePath)
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to import Python module "${modulePath}": ${err.message}`)
    }
    throw err
  }

  return PythonModuleProxy.create(nativeModule, addon)
}

const version: string = (() => {
  try {
    return addon.getVersion()
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

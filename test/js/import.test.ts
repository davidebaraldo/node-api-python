import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'path'

/**
 * Tests for Python module importing (Phase 1).
 *
 * These tests verify that importing Python modules from JS works correctly
 * for relative paths, absolute paths, stdlib modules, and error conditions.
 */

// We use dynamic import / require since the native addon must be built first.
// The API surface is: python.import(modulePath, options?) -> PythonModule
let python: any

beforeAll(() => {
  python = require('../../lib/index')
})

describe('python.import — module loading', () => {
  const fixturesDir = path.resolve(__dirname, '..', 'fixtures')

  describe('relative and absolute paths', () => {
    it('should import a module from a relative path', () => {
      const mod = python.import('./test/fixtures/type_test')
      expect(mod).toBeDefined()
      // Verify we can access a function on the module
      const result = mod.get_intSync()
      expect(result).toBe(42)
    })

    it('should import a module from an absolute path', () => {
      const absPath = path.resolve(fixturesDir, 'type_test')
      const mod = python.import(absPath)
      expect(mod).toBeDefined()
      const result = mod.get_strSync()
      expect(result).toBe('hello')
    })

    it('should import a module with .py extension stripped', () => {
      // Whether user passes "compute" or "compute.py", it should work
      const mod = python.import('./test/fixtures/compute')
      expect(mod).toBeDefined()
      const result = mod.addSync(1, 2)
      expect(result).toBe(3)
    })
  })

  describe('stdlib packages', () => {
    it('should import the json stdlib module', () => {
      const json = python.import('json')
      expect(json).toBeDefined()
      // json.dumps should be callable
      const result = json.dumpsSync([1, 2, 3])
      expect(result).toBe('[1, 2, 3]')
    })

    it('should import the os stdlib module', () => {
      const os = python.import('os')
      expect(os).toBeDefined()
      // os.getcwd should return a string
      const cwd = os.getcwdSync()
      expect(typeof cwd).toBe('string')
      expect(cwd.length).toBeGreaterThan(0)
    })

    it('should import the math stdlib module', () => {
      const math = python.import('math')
      expect(math).toBeDefined()
      const result = math.sqrtSync(16)
      expect(result).toBe(4)
    })
  })

  describe('error handling', () => {
    it('should throw if the module is not found', () => {
      expect(() => {
        python.import('nonexistent_module_xyz_12345')
      }).toThrow()
    })

    it('should include the module name in the error message', () => {
      expect(() => {
        python.import('nonexistent_module_xyz_12345')
      }).toThrow(/nonexistent_module_xyz_12345/)
    })

    it('should throw if a relative path does not exist', () => {
      expect(() => {
        python.import('./this/path/does/not/exist')
      }).toThrow()
    })
  })

  describe('module caching', () => {
    it('should return the same instance when importing the same module twice', () => {
      const mod1 = python.import('./test/fixtures/compute')
      const mod2 = python.import('./test/fixtures/compute')
      // Both proxies should wrap the same module — verify by calling a function
      const r1 = mod1.addSync(10, 20)
      const r2 = mod2.addSync(10, 20)
      expect(r1).toBe(r2)
      expect(r1).toBe(30)
    })
  })

  describe('custom sys.path', () => {
    it('should import from a custom sys.path via options', () => {
      const mod = python.import('type_test', {
        paths: [fixturesDir],
      })
      expect(mod).toBeDefined()
      const result = mod.get_intSync()
      expect(result).toBe(42)
    })
  })
})

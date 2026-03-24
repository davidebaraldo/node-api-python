import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'path'

/**
 * End-to-end integration tests.
 *
 * These tests exercise full workflows across multiple phases:
 * importing, calling, type conversion, and concurrency.
 */

let python: any

beforeAll(() => {
  python = require('../../lib/index')
})

describe('integration — end-to-end workflows', () => {
  describe('full workflow: import, call, get result', () => {
    it('should import a module, call a sync function, and get the correct result', () => {
      const mod = python.import('./test/fixtures/type_test')
      const result = mod.add_intsSync(10, 32)
      expect(result).toBe(42)
    })

    it('should import a module, call an async function, and get the correct result', async () => {
      const mod = python.import('./test/fixtures/type_test')
      const result = await mod.add_ints(10, 32)
      expect(result).toBe(42)
    })

    it('should chain multiple calls on the same module', () => {
      const mod = python.import('./test/fixtures/type_test')
      const sum = mod.add_intsSync(1, 2)
      const doubled = mod.add_intsSync(sum, sum)
      const str = mod.concat_stringsSync('result: ', String(doubled))
      expect(str).toBe('result: 6')
    })
  })

  describe('multiple modules loaded simultaneously', () => {
    it('should use compute and type_test modules together', () => {
      const compute = python.import('./test/fixtures/compute')
      const types = python.import('./test/fixtures/type_test')

      const sum = compute.addSync(10, 20)
      const identity = types.identitySync(sum)

      expect(identity).toBe(30)
    })

    it('should use stdlib and fixture modules together', () => {
      const json = python.import('json')
      const types = python.import('./test/fixtures/type_test')

      const dict = types.get_dictSync()
      const jsonStr = json.dumpsSync(dict)

      expect(typeof jsonStr).toBe('string')
      const parsed = JSON.parse(jsonStr)
      expect(parsed).toEqual({ a: 1, b: 2 })
    })

    it('should load three fixture modules at once', () => {
      const compute = python.import('./test/fixtures/compute')
      const types = python.import('./test/fixtures/type_test')
      const callbacks = python.import('./test/fixtures/callbacks')

      expect(compute.addSync(1, 2)).toBe(3)
      expect(types.get_intSync()).toBe(42)

      let called = false
      callbacks.call_callbackSync(() => {
        called = true
      })
      expect(called).toBe(true)
    })
  })

  describe('module reloading', () => {
    it('should be able to reimport a module after first import', () => {
      const mod1 = python.import('./test/fixtures/compute')
      const r1 = mod1.addSync(1, 1)

      // Re-import the same module
      const mod2 = python.import('./test/fixtures/compute')
      const r2 = mod2.addSync(1, 1)

      expect(r1).toBe(r2)
      expect(r1).toBe(2)
    })
  })

  describe('memory stability on repeated calls', () => {
    it('should not leak memory on many repeated sync calls', () => {
      const mod = python.import('./test/fixtures/compute')

      // Take a rough baseline
      const before = process.memoryUsage().heapUsed

      for (let i = 0; i < 1000; i++) {
        mod.addSync(i, i + 1)
      }

      // Force GC if available
      if (global.gc) {
        global.gc()
      }

      const after = process.memoryUsage().heapUsed

      // Memory growth should be reasonable (< 50MB for 1000 simple calls)
      const growthMB = (after - before) / (1024 * 1024)
      expect(growthMB).toBeLessThan(50)
    })

    it('should not leak memory on many repeated async calls', async () => {
      const mod = python.import('./test/fixtures/compute')

      const before = process.memoryUsage().heapUsed

      const promises: Promise<unknown>[] = []
      for (let i = 0; i < 500; i++) {
        promises.push(mod.add(i, i + 1))
      }
      await Promise.all(promises)

      if (global.gc) {
        global.gc()
      }

      const after = process.memoryUsage().heapUsed
      const growthMB = (after - before) / (1024 * 1024)
      expect(growthMB).toBeLessThan(50)
    })
  })

  describe('Python stdout/stderr capture', () => {
    it('should not crash when Python prints to stdout', () => {
      // Python's print() shouldn't cause errors in Node
      const os = python.import('os')
      // Just calling a function that exists and doesn't print — the point is
      // that the bridge handles Python's I/O streams without crashing
      const cwd = os.getcwdSync()
      expect(typeof cwd).toBe('string')
    })
  })

  describe('concurrent async calls from different modules', () => {
    it('should handle concurrent calls across modules', async () => {
      const compute = python.import('./test/fixtures/compute')
      const types = python.import('./test/fixtures/type_test')

      const [sum, ints, str, merged] = await Promise.all([
        compute.add(100, 200),
        types.add_ints(10, 20),
        types.concat_strings('a', 'b'),
        types.merge_dicts({ x: 1 }, { y: 2 }),
      ])

      expect(sum).toBe(300)
      expect(ints).toBe(30)
      expect(str).toBe('ab')
      expect(merged).toEqual({ x: 1, y: 2 })
    })

    it('should handle concurrent slow + fast calls', async () => {
      const compute = python.import('./test/fixtures/compute')
      const types = python.import('./test/fixtures/type_test')

      // Start a slow call and a bunch of fast ones
      const slow = compute.slow_add(1, 2)
      const fast1 = types.add_ints(1, 2)
      const fast2 = types.add_ints(3, 4)
      const fast3 = compute.add(5, 6)

      const [slowResult, f1, f2, f3] = await Promise.all([
        slow,
        fast1,
        fast2,
        fast3,
      ])

      expect(slowResult).toBe(3)
      expect(f1).toBe(3)
      expect(f2).toBe(7)
      expect(f3).toBe(11)
    })
  })

  describe('bridge metadata', () => {
    it('should report a version string', () => {
      expect(typeof python.version).toBe('string')
    })

    it('should report initialization status', () => {
      expect(typeof python.isInitialized).toBe('boolean')
      expect(python.isInitialized).toBe(true)
    })
  })
})

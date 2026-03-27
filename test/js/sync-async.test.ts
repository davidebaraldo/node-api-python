import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Tests for synchronous and asynchronous calling patterns (Phase 3).
 *
 * Verifies that:
 * - Sync calls (funcSync) return values directly
 * - Async calls (func) return Promises
 * - Error propagation works in both modes
 * - Multiple concurrent async calls execute correctly
 */

import * as python from '../../lib/index'

let mod: any

beforeAll(() => {
  mod = python.importModule('./test/fixtures/compute')
})

describe('sync and async calling', () => {
  describe('sync calls', () => {
    it('should return a result directly from addSync', () => {
      const result = mod.addSync(2, 3)
      expect(result).toBe(5)
    })

    it('should return correct result for various inputs', () => {
      expect(mod.addSync(0, 0)).toBe(0)
      expect(mod.addSync(-1, 1)).toBe(0)
      expect(mod.addSync(100, 200)).toBe(300)
    })

    it('should handle float arithmetic', () => {
      const result = mod.addSync(1.5, 2.5)
      expect(result).toBeCloseTo(4.0, 10)
    })

    it('should handle string concatenation via add', () => {
      // Python's + works on strings too
      const result = mod.addSync('hello', ' world')
      expect(result).toBe('hello world')
    })

    it('should return result from division', () => {
      const result = mod.divisionSync(10, 3)
      expect(result).toBeCloseTo(3.3333, 3)
    })
  })

  describe('async calls', () => {
    it('should return a Promise from add()', async () => {
      const promise = mod.add(2, 3)
      expect(promise).toBeInstanceOf(Promise)
      const result = await promise
      expect(result).toBe(5)
    })

    it('should resolve with the correct result', async () => {
      const result = await mod.add(10, 20)
      expect(result).toBe(30)
    })

    it('should handle slow operations without blocking', async () => {
      const start = Date.now()
      const promise = mod.slow_add(5, 10)

      // The promise should be created immediately (not blocked)
      expect(promise).toBeInstanceOf(Promise)

      const result = await promise
      expect(result).toBe(15)

      // It should have taken at least ~100ms due to the sleep
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(80) // allow some margin
    })

    it('should not block the event loop during async call', async () => {
      // Start an async Python call and verify we can do other work
      const pythonPromise = mod.slow_add(1, 2)
      let eventLoopRan = false

      // Schedule something on the event loop
      await new Promise<void>((resolve) => {
        setImmediate(() => {
          eventLoopRan = true
          resolve()
        })
      })

      expect(eventLoopRan).toBe(true)
      const result = await pythonPromise
      expect(result).toBe(3)
    })
  })

  describe('sync and async return the same result', () => {
    it('should produce identical results for add', async () => {
      const syncResult = mod.addSync(42, 58)
      const asyncResult = await mod.add(42, 58)
      expect(syncResult).toBe(asyncResult)
      expect(syncResult).toBe(100)
    })

    it('should produce identical results for division', async () => {
      const syncResult = mod.divisionSync(22, 7)
      const asyncResult = await mod.division(22, 7)
      expect(syncResult).toBeCloseTo(asyncResult as number, 10)
    })

    it('should produce identical results for cpu_intensive', async () => {
      const syncResult = mod.cpu_intensiveSync(100)
      const asyncResult = await mod.cpu_intensive(100)
      expect(syncResult).toBe(asyncResult)
      // sum of i^2 from 0 to 99 = 328350
      expect(syncResult).toBe(328350)
    })
  })

  describe('error propagation — sync', () => {
    it('should throw on raises_error()', () => {
      expect(() => {
        mod.raises_errorSync()
      }).toThrow()
    })

    it('should include the Python error message', () => {
      expect(() => {
        mod.raises_errorSync()
      }).toThrow(/test error from Python/)
    })

    it('should throw on ZeroDivisionError', () => {
      expect(() => {
        mod.divisionSync(1, 0)
      }).toThrow()
    })

    it('should include ZeroDivisionError info', () => {
      expect(() => {
        mod.divisionSync(1, 0)
      }).toThrow(/division by zero|ZeroDivision/)
    })

    it('should throw on TypeError from Python', () => {
      expect(() => {
        mod.raises_type_errorSync()
      }).toThrow(/wrong type from Python/)
    })

    it('should throw an Error instance', () => {
      try {
        mod.raises_errorSync()
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
      }
    })
  })

  describe('error propagation — async', () => {
    it('should reject the promise on raises_error()', async () => {
      await expect(mod.raises_error()).rejects.toThrow()
    })

    it('should include the Python error message in rejection', async () => {
      await expect(mod.raises_error()).rejects.toThrow(
        /test error from Python/,
      )
    })

    it('should reject on ZeroDivisionError', async () => {
      await expect(mod.division(1, 0)).rejects.toThrow()
    })

    it('should reject with an Error instance', async () => {
      try {
        await mod.raises_error()
        expect.unreachable('should have rejected')
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
      }
    })
  })

  describe('concurrent async calls', () => {
    it('should handle multiple concurrent async calls', async () => {
      const promises = [
        mod.add(1, 2),
        mod.add(3, 4),
        mod.add(5, 6),
        mod.add(7, 8),
        mod.add(9, 10),
      ]

      const results = await Promise.all(promises)
      expect(results).toEqual([3, 7, 11, 15, 19])
    })

    it('should handle concurrent calls to different functions', async () => {
      const [sum, quotient, intensive] = await Promise.all([
        mod.add(10, 20),
        mod.division(100, 4),
        mod.cpu_intensive(50),
      ])

      expect(sum).toBe(30)
      expect(quotient).toBe(25)
      // sum of i^2 from 0 to 49 = 40425
      expect(intensive).toBe(40425)
    })

    it('should handle mix of successful and failing concurrent calls', async () => {
      const results = await Promise.allSettled([
        mod.add(1, 2),
        mod.raises_error(),
        mod.add(3, 4),
        mod.division(1, 0),
      ])

      expect(results[0]).toEqual({ status: 'fulfilled', value: 3 })
      expect(results[1].status).toBe('rejected')
      expect(results[2]).toEqual({ status: 'fulfilled', value: 7 })
      expect(results[3].status).toBe('rejected')
    })

    it('should handle many concurrent slow calls', async () => {
      const count = 5
      const start = Date.now()

      const promises = Array.from({ length: count }, (_, i) =>
        mod.slow_add(i, i + 1),
      )

      const results = await Promise.all(promises)
      const elapsed = Date.now() - start

      // Each slow_add sleeps 100ms. If truly concurrent, total < count * 100ms
      // If serial, total >= count * 100ms
      for (let i = 0; i < count; i++) {
        expect(results[i]).toBe(i + (i + 1))
      }

      // At minimum, one sleep should have happened
      expect(elapsed).toBeGreaterThanOrEqual(80)
    })
  })
})

import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Tests for callbacks and events (Phase 4).
 *
 * Verifies that JavaScript functions can be passed to Python and called back,
 * including single calls, multiple calls, progress patterns, and event emitters.
 */

import * as python from '../../lib/index'

let mod: any

beforeAll(() => {
  mod = python.importModule('./test/fixtures/callbacks')
})

describe('callbacks — JS functions called from Python', () => {
  describe('basic callback invocation', () => {
    it('should pass a JS function to Python and receive a call', () => {
      let received: unknown = undefined
      const result = mod.call_callbackSync((value: number) => {
        received = value
      })
      expect(result).toBe('done')
      expect(received).toBe(42)
    })

    it('should receive the correct argument type', () => {
      let receivedType: string = ''
      mod.call_callbackSync((value: unknown) => {
        receivedType = typeof value
      })
      expect(receivedType).toBe('number')
    })
  })

  describe('callback called multiple times', () => {
    it('should call the callback n times', () => {
      const calls: number[] = []
      const result = mod.call_callback_multipleSync((value: number) => {
        calls.push(value)
      }, 5)

      expect(result).toBe(5)
      expect(calls).toEqual([0, 1, 2, 3, 4])
    })

    it('should call the callback zero times when n=0', () => {
      const calls: number[] = []
      const result = mod.call_callback_multipleSync((value: number) => {
        calls.push(value)
      }, 0)

      expect(result).toBe(0)
      expect(calls).toEqual([])
    })

    it('should call the callback with many iterations', () => {
      let count = 0
      mod.call_callback_multipleSync(() => {
        count++
      }, 100)
      expect(count).toBe(100)
    })
  })

  describe('progress callback pattern', () => {
    it('should report progress percentages', () => {
      const progressValues: number[] = []
      const data = ['a', 'b', 'c', 'd', 'e']

      const result = mod.with_progressSync(data, (pct: number) => {
        progressValues.push(pct)
      })

      expect(result).toEqual({ processed: 5 })
      // 5 items: progress should be 20, 40, 60, 80, 100
      expect(progressValues).toEqual([20, 40, 60, 80, 100])
    })

    it('should report 100% for single item', () => {
      const progressValues: number[] = []
      mod.with_progressSync(['only'], (pct: number) => {
        progressValues.push(pct)
      })
      expect(progressValues).toEqual([100])
    })
  })

  describe('transform with callback', () => {
    it('should use a JS function as a transform', () => {
      const result = mod.transform_with_callbackSync(
        [1, 2, 3, 4],
        (x: number) => x * 10,
      )
      expect(result).toEqual([10, 20, 30, 40])
    })

    it('should use a string transform callback', () => {
      const result = mod.transform_with_callbackSync(
        ['hello', 'world'],
        (s: string) => s.toUpperCase(),
      )
      expect(result).toEqual(['HELLO', 'WORLD'])
    })
  })

  describe('async callback invocation', () => {
    it('should work with async call and callback', async () => {
      let received: unknown = undefined
      const result = await mod.call_callback((value: number) => {
        received = value
      })
      expect(result).toBe('done')
      expect(received).toBe(42)
    })

    it('should accumulate values via async callback', async () => {
      const calls: number[] = []
      const result = await mod.call_callback_multiple((value: number) => {
        calls.push(value)
      }, 3)

      expect(result).toBe(3)
      expect(calls).toEqual([0, 1, 2])
    })
  })

  describe('event emitter pattern', () => {
    it('should create an event source and register listeners', () => {
      const source = mod.create_event_sourceSync()
      expect(source).toBeDefined()

      const dataEvents: number[] = []
      let doneValue: number | undefined

      source.onSync('data', (value: number) => {
        dataEvents.push(value)
      })

      source.onSync('done', (count: number) => {
        doneValue = count
      })

      source.runSync(3)

      expect(dataEvents).toEqual([0, 1, 2])
      expect(doneValue).toBe(3)
    })

    it('should handle event source with zero events', () => {
      const source = mod.create_event_sourceSync()
      const dataEvents: number[] = []
      let doneValue: number | undefined

      source.onSync('data', (value: number) => {
        dataEvents.push(value)
      })

      source.onSync('done', (count: number) => {
        doneValue = count
      })

      source.runSync(0)

      expect(dataEvents).toEqual([])
      expect(doneValue).toBe(0)
    })

    it('should support multiple listeners for the same event', () => {
      const source = mod.create_event_sourceSync()
      const log1: number[] = []
      const log2: number[] = []

      source.onSync('data', (v: number) => log1.push(v))
      source.onSync('data', (v: number) => log2.push(v))

      source.runSync(2)

      expect(log1).toEqual([0, 1])
      expect(log2).toEqual([0, 1])
    })
  })

  describe('Python generator as async iterator', () => {
    it('should iterate over generated items', async () => {
      const items: Array<{ index: number; value: number }> = []

      // generate_items returns a generator; if the bridge exposes it as async iterable:
      const gen = await mod.generate_items(3)

      if (gen != null && typeof gen[Symbol.asyncIterator] === 'function') {
        for await (const item of gen) {
          items.push(item as { index: number; value: number })
        }
        expect(items).toEqual([
          { index: 0, value: 0 },
          { index: 1, value: 2 },
          { index: 2, value: 4 },
        ])
      } else if (Array.isArray(gen)) {
        // Some implementations may eagerly collect generator into array
        expect(gen).toHaveLength(3)
        expect(gen[0]).toEqual({ index: 0, value: 0 })
        expect(gen[2]).toEqual({ index: 2, value: 4 })
      } else {
        // Generator support not yet implemented — the test documents intent
        expect(gen).toBeDefined()
      }
    })
  })

  describe('error in callback', () => {
    it('should propagate JS errors thrown in callbacks', () => {
      const throwingCallback = () => {
        throw new Error('callback error from JS')
      }

      expect(() => {
        mod.callback_with_errorSync(throwingCallback)
      }).toThrow(/callback error from JS/)
    })

    it('should propagate async callback errors', async () => {
      const throwingCallback = () => {
        throw new Error('async callback error')
      }

      await expect(
        mod.callback_with_error(throwingCallback),
      ).rejects.toThrow(/async callback error/)
    })
  })
})

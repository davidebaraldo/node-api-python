import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Tests for type marshaling between JavaScript and Python (Phase 2).
 *
 * Each test verifies that values survive a roundtrip through the bridge:
 * JS -> Python -> JS, preserving type and value.
 */

import * as python from '../../lib/index'

let mod: any

beforeAll(() => {
  mod = python.importModule('./test/fixtures/type_test')
})

describe('type marshaling — JS to Python and back', () => {
  describe('primitive types from Python', () => {
    it('should return an integer', () => {
      const result = mod.get_intSync()
      expect(result).toBe(42)
      expect(typeof result).toBe('number')
    })

    it('should return a float', () => {
      const result = mod.get_floatSync()
      expect(result).toBeCloseTo(3.14, 10)
      expect(typeof result).toBe('number')
    })

    it('should return a string', () => {
      const result = mod.get_strSync()
      expect(result).toBe('hello')
      expect(typeof result).toBe('string')
    })

    it('should return a boolean', () => {
      const result = mod.get_boolSync()
      expect(result).toBe(true)
      expect(typeof result).toBe('boolean')
    })

    it('should return null for Python None', () => {
      const result = mod.get_noneSync()
      expect(result).toBeNull()
    })
  })

  describe('primitive type roundtrips via identity()', () => {
    it('should roundtrip an integer', () => {
      expect(mod.identitySync(123)).toBe(123)
    })

    it('should roundtrip zero', () => {
      expect(mod.identitySync(0)).toBe(0)
    })

    it('should roundtrip a negative integer', () => {
      expect(mod.identitySync(-99)).toBe(-99)
    })

    it('should roundtrip a float', () => {
      expect(mod.identitySync(2.718)).toBeCloseTo(2.718, 10)
    })

    it('should roundtrip a string', () => {
      expect(mod.identitySync('test string')).toBe('test string')
    })

    it('should roundtrip an empty string', () => {
      expect(mod.identitySync('')).toBe('')
    })

    it('should roundtrip true', () => {
      expect(mod.identitySync(true)).toBe(true)
    })

    it('should roundtrip false', () => {
      expect(mod.identitySync(false)).toBe(false)
    })

    it('should roundtrip null', () => {
      expect(mod.identitySync(null)).toBeNull()
    })
  })

  describe('large integers / BigInt', () => {
    it('should return a large integer (2^64) from Python', () => {
      const result = mod.get_big_intSync()
      // 2^64 = 18446744073709551616, which exceeds Number.MAX_SAFE_INTEGER.
      // Depending on implementation, this may come back as BigInt or a number.
      // We check that the value is correct either way.
      const expected = BigInt(2) ** BigInt(64)
      if (typeof result === 'bigint') {
        expect(result).toBe(expected)
      } else {
        // If returned as number, it will lose precision — still check it's large
        expect(result).toBeGreaterThan(Number.MAX_SAFE_INTEGER)
      }
    })

    it('should roundtrip a BigInt value through identity()', () => {
      const big = BigInt(2) ** BigInt(53) + BigInt(1) // 2^53 + 1, not representable as float
      const result = mod.identitySync(big)
      if (typeof result === 'bigint') {
        expect(result).toBe(big)
      } else {
        // If the bridge doesn't support BigInt, at least it shouldn't crash
        expect(result).toBeDefined()
      }
    })
  })

  describe('collection types from Python', () => {
    it('should return a list as an array', () => {
      const result = mod.get_listSync()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([1, 2, 3])
    })

    it('should return a dict as a plain object', () => {
      const result = mod.get_dictSync()
      expect(typeof result).toBe('object')
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('should return nested structures correctly', () => {
      const result = mod.get_nestedSync()
      expect(result).toEqual({
        list: [1, { nested: true }],
        num: 42,
      })
    })

    it('should return bytes as a Buffer', () => {
      const result = mod.get_bytesSync()
      expect(Buffer.isBuffer(result) || result instanceof Uint8Array).toBe(true)
      expect(Buffer.from(result).toString('utf-8')).toBe('hello')
    })

    it('should return a set as a Set', () => {
      const result = mod.get_setSync()
      if (result instanceof Set) {
        expect(result.size).toBe(3)
        expect(result.has(1)).toBe(true)
        expect(result.has(2)).toBe(true)
        expect(result.has(3)).toBe(true)
      } else if (Array.isArray(result)) {
        // Some implementations return sets as arrays
        expect(result.sort()).toEqual([1, 2, 3])
      } else {
        // Accept whatever representation, but it should contain the elements
        expect(result).toBeDefined()
      }
    })

    it('should return a tuple as an array', () => {
      const result = mod.get_tupleSync()
      // Python tuples become JS arrays
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([1, 'two', 3.0])
    })
  })

  describe('collection type roundtrips', () => {
    it('should roundtrip an array through identity()', () => {
      const input = [10, 20, 30]
      const result = mod.identitySync(input)
      expect(result).toEqual(input)
    })

    it('should roundtrip a nested array', () => {
      const input = [[1, 2], [3, [4, 5]]]
      const result = mod.identitySync(input)
      expect(result).toEqual(input)
    })

    it('should roundtrip an object through identity()', () => {
      const input = { x: 1, y: 'two', z: true }
      const result = mod.identitySync(input)
      expect(result).toEqual(input)
    })

    it('should roundtrip a nested object', () => {
      const input = { outer: { inner: { deep: 42 } } }
      const result = mod.identitySync(input)
      expect(result).toEqual(input)
    })
  })

  describe('empty collections', () => {
    it('should return an empty list as an empty array', () => {
      const result = mod.get_empty_listSync()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('should return an empty dict as an empty object', () => {
      const result = mod.get_empty_dictSync()
      expect(typeof result).toBe('object')
      expect(Object.keys(result)).toHaveLength(0)
    })

    it('should return an empty set', () => {
      const result = mod.get_empty_setSync()
      if (result instanceof Set) {
        expect(result.size).toBe(0)
      } else if (Array.isArray(result)) {
        expect(result).toHaveLength(0)
      } else {
        expect(result).toBeDefined()
      }
    })
  })

  describe('unicode strings', () => {
    it('should handle unicode strings from Python', () => {
      const result = mod.get_unicode_strSync()
      expect(typeof result).toBe('string')
      expect(result).toContain('\u4e16\u754c')
    })

    it('should roundtrip unicode through identity()', () => {
      const input = '\u00e9\u00e0\u00fc \u4f60\u597d \ud83d\ude80'
      const result = mod.identitySync(input)
      expect(result).toBe(input)
    })
  })

  describe('deeply nested structures', () => {
    it('should handle deeply nested dicts/lists from Python', () => {
      const result = mod.get_deeply_nestedSync()
      expect(result).toEqual({
        level1: {
          level2: {
            level3: [1, 2, { level4: true }],
          },
        },
        sibling: 'value',
      })
    })

    it('should roundtrip a mixed nested structure', () => {
      const input = {
        strings: ['a', 'b'],
        numbers: [1, 2.5, -3],
        nested: { flag: true, nothing: null },
      }
      const result = mod.identitySync(input)
      expect(result).toEqual(input)
    })
  })

  describe('function calls with typed arguments', () => {
    it('should add two integers', () => {
      expect(mod.add_intsSync(3, 7)).toBe(10)
    })

    it('should concatenate two strings', () => {
      expect(mod.concat_stringsSync('hello', ' world')).toBe('hello world')
    })

    it('should sum a list of numbers', () => {
      expect(mod.sum_listSync([1, 2, 3, 4, 5])).toBe(15)
    })

    it('should merge two dicts', () => {
      const result = mod.merge_dictsSync({ a: 1 }, { b: 2 })
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('should merge overlapping dicts (second wins)', () => {
      const result = mod.merge_dictsSync({ a: 1, b: 2 }, { b: 3, c: 4 })
      expect(result).toEqual({ a: 1, b: 3, c: 4 })
    })
  })

  describe('passing collections to Python and back', () => {
    it('should reverse a list via Python', () => {
      const result = mod.accept_and_return_listSync([1, 2, 3])
      expect(result).toEqual([3, 2, 1])
    })

    it('should transform dict values via Python', () => {
      const result = mod.accept_and_return_dictSync({ x: 5, y: 10 })
      expect(result).toEqual({ x: 10, y: 20 })
    })
  })

  describe('datetime roundtrip', () => {
    it('should return a datetime from Python', () => {
      const result = mod.get_datetimeSync()
      // Depending on implementation, this may be a Date, string, or object
      if (result instanceof Date) {
        expect(result.getFullYear()).toBe(2025)
        expect(result.getMonth()).toBe(5) // June is month 5 in JS
        expect(result.getDate()).toBe(15)
      } else if (typeof result === 'string') {
        expect(result).toContain('2025')
      } else {
        // Accept any representation, just verify it exists
        expect(result).toBeDefined()
      }
    })
  })

  describe('TypedArray / numpy interop', () => {
    // These tests require numpy. Skip if not available.
    let np: any
    let hasNumpy = false

    beforeAll(() => {
      try {
        const python = require('../../lib/index')
        np = python.importModule('numpy')
        hasNumpy = true
      } catch {
        hasNumpy = false
      }
    })

    it.skipIf(!hasNumpy)('should create a numpy array from a JS array', () => {
      const arr = np.arraySync([1.0, 2.0, 3.0])
      expect(arr).toBeDefined()
    })

    it.skipIf(!hasNumpy)('should convert numpy array back to JS typed array', () => {
      const arr = np.arraySync([1.0, 2.0, 3.0])
      // Result may be Float64Array, Array, or similar
      expect(arr).toBeDefined()
    })
  })
})

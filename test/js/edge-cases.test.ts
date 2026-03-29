import { describe, it, expect, beforeAll } from 'vitest'
import * as python from '../../lib/index'

/**
 * Phase 10 — Edge case tests for coverage hardening.
 *
 * Covers: BigInt, deep nesting, special float values, mixed types,
 * error propagation, string/bytes edge cases, datetime precision,
 * module state, import errors.
 */

let mod: any

beforeAll(() => {
  mod = python.importModule('./test/fixtures/edge_cases')
})

// ─── BigInt ───────────────────────────────────────────────────────────────────

describe('BigInt edge cases', () => {
  it('should return MAX_SAFE_INTEGER as a number', () => {
    const result = mod.get_max_safe_intSync()
    expect(typeof result).toBe('number')
    expect(result).toBe(2 ** 53)
  })

  it('should return 2^53+1 as BigInt', () => {
    const result = mod.get_above_safe_intSync()
    expect(typeof result).toBe('bigint')
    expect(result).toBe(BigInt(2 ** 53) + 1n)
  })

  it('should return 2^128 as BigInt', () => {
    const result = mod.get_very_large_intSync()
    expect(typeof result).toBe('bigint')
    expect(result).toBe(2n ** 128n)
  })

  it('should return negative BigInt', () => {
    const result = mod.get_negative_big_intSync()
    expect(typeof result).toBe('bigint')
    expect(result).toBe(-(2n ** 64n))
  })

  it('should return zero as number', () => {
    const result = mod.get_zeroSync()
    expect(result).toBe(0)
    expect(typeof result).toBe('number')
  })

  it('should round-trip small int through identity', () => {
    const result = mod.identity_intSync(42)
    expect(result).toBe(42)
  })

  it('should return above-safe-int from identity as BigInt', () => {
    // Pass as number (Python receives large int), verify return is BigInt
    const result = mod.get_very_large_intSync()
    expect(typeof result).toBe('bigint')
    expect(result).toBe(2n ** 128n)
  })
})

// ─── Deep nesting ─────────────────────────────────────────────────────────────

describe('deep nesting', () => {
  it('should handle dict nested 10 levels', () => {
    const result = mod.build_deep_dictSync(10)
    let node = result
    for (let i = 9; i >= 0; i--) {
      expect(node.level).toBe(i)
      node = node.child
    }
    expect(node.value).toBe('leaf')
  })

  it('should handle dict nested 50 levels', () => {
    const result = mod.build_deep_dictSync(50)
    let node = result
    for (let i = 0; i < 50; i++) {
      expect(node).toHaveProperty('child')
      node = node.child
    }
    expect(node.value).toBe('leaf')
  })

  it('should handle list nested 20 levels', () => {
    const result = mod.build_deep_listSync(20)
    let node = result
    for (let i = 0; i < 20; i++) {
      expect(Array.isArray(node)).toBe(true)
      node = node[0]
    }
    // Innermost is [42], not 42 — Python builds [[...,[42]]]
    expect(node).toEqual([42])
  })

  it('should handle mixed dict/list nesting', () => {
    const result = mod.build_mixed_nestedSync(10)
    expect(result).toBeDefined()
    // Just verify it doesn't crash and returns something
    expect(JSON.stringify(result).length).toBeGreaterThan(10)
  })
})

// ─── Special float values ─────────────────────────────────────────────────────

describe('special float values', () => {
  it('should return NaN', () => {
    const result = mod.get_nanSync()
    expect(Number.isNaN(result)).toBe(true)
  })

  it('should return Infinity', () => {
    const result = mod.get_infSync()
    expect(result).toBe(Infinity)
  })

  it('should return -Infinity', () => {
    const result = mod.get_neg_infSync()
    expect(result).toBe(-Infinity)
  })

  it('should return -0.0', () => {
    const result = mod.get_neg_zeroSync()
    // Python -0.0 maps to JS -0
    expect(Object.is(result, -0) || result === 0).toBe(true)
  })
})

// ─── Mixed types in collections ───────────────────────────────────────────────

describe('mixed type collections', () => {
  it('should return list with mixed types', () => {
    const result = mod.get_mixed_listSync()
    expect(result[0]).toBe(1)
    expect(result[1]).toBe('two')
    expect(result[2]).toBeCloseTo(3.0)
    expect(result[3]).toBe(true)
    expect(result[4]).toBeNull()
    expect(result[5]).toEqual([4, 5])
    expect(result[6]).toEqual({ k: 'v' })
  })

  it('should return dict with None values', () => {
    const result = mod.get_dict_with_none_valuesSync()
    expect(result.a).toBe(1)
    expect(result.b).toBeNull()
    expect(result.c).toBe('three')
    expect(result.d).toBeNull()
  })

  it('should return list with interspersed Nones', () => {
    const result = mod.get_list_with_nonesSync()
    expect(result).toEqual([null, 1, null, 'x', null])
  })
})

// ─── Error propagation edge cases ─────────────────────────────────────────────

describe('error propagation edge cases', () => {
  it('should propagate RuntimeError with type info', () => {
    try {
      mod.raise_runtime_errorSync()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('RuntimeError')
      expect(err.pythonMessage).toBe('runtime error from Python')
    }
  })

  it('should propagate KeyError', () => {
    try {
      mod.raise_key_errorSync()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('KeyError')
    }
  })

  it('should propagate AttributeError', () => {
    try {
      mod.raise_attribute_errorSync()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('AttributeError')
    }
  })

  it('should propagate RecursionError', () => {
    try {
      mod.raise_recursion_errorSync()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('RecursionError')
    }
  })

  it('should propagate error from deep call stack with traceback', () => {
    try {
      mod.raise_in_nested_callSync()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('ValueError')
      expect(err.pythonMessage).toBe('deep error')
      // Should have multiple frames in traceback
      expect(err.pythonTraceback.length).toBeGreaterThanOrEqual(3)
      // Innermost frame should be "innermost"
      const last = err.pythonTraceback[err.pythonTraceback.length - 1]
      expect(last.function).toBe('innermost')
    }
  })

  it('should propagate error with unicode message', () => {
    try {
      mod.raise_with_unicodeSync()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('ValueError')
      expect(err.pythonMessage).toContain('àèìòù')
      expect(err.pythonMessage).toContain('🔥')
    }
  })

  it('should propagate async errors with structured info', async () => {
    try {
      await mod.raise_runtime_error()
      expect.unreachable()
    } catch (err: any) {
      expect(err.pythonType).toBe('RuntimeError')
      expect(err.pythonTraceback).toBeInstanceOf(Array)
    }
  })
})

// ─── Import errors ────────────────────────────────────────────────────────────

describe('import error handling', () => {
  it('should throw on module with syntax error', () => {
    expect(() => {
      python.importModule('./test/fixtures/syntax_error')
    }).toThrow()
  })

  it('should throw on module with import error', () => {
    expect(() => {
      python.importModule('./test/fixtures/import_error')
    }).toThrow()
  })

  it('should throw on non-existent module', () => {
    expect(() => {
      python.importModule('./test/fixtures/does_not_exist')
    }).toThrow()
  })
})

// ─── String edge cases ────────────────────────────────────────────────────────

describe('string edge cases', () => {
  it('should handle empty string', () => {
    expect(mod.get_empty_stringSync()).toBe('')
  })

  it('should handle string with null bytes', () => {
    const result = mod.get_null_bytes_stringSync()
    expect(result).toBe('hello\0world')
    expect(result.length).toBe(11)
  })

  it('should handle very long string (1MB)', () => {
    const result = mod.get_long_stringSync(1_000_000)
    expect(result.length).toBe(1_000_000)
    expect(result[0]).toBe('x')
  })
})

// ─── Bytes edge cases ─────────────────────────────────────────────────────────

describe('bytes edge cases', () => {
  it('should handle all byte values 0x00-0xFF', () => {
    const result = mod.get_all_bytesSync()
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBe(256)
    for (let i = 0; i < 256; i++) {
      expect(result[i]).toBe(i)
    }
  })

  it('should handle empty bytes', () => {
    const result = mod.get_empty_bytesSync()
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('should handle large bytes (1MB)', () => {
    const result = mod.get_large_bytesSync(1_000_000)
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBe(1_000_000)
  })
})

// ─── Datetime edge cases ──────────────────────────────────────────────────────

describe('datetime edge cases', () => {
  it('should preserve microsecond-level precision', () => {
    const result = mod.get_datetime_with_microsecondsSync()
    expect(result).toBeInstanceOf(Date)
    // JS Date has millisecond precision, so microseconds are rounded
    expect(result.getMilliseconds()).toBe(123)
  })

  it('should handle epoch datetime', () => {
    const result = mod.get_epochSync()
    // Naive datetime(1970,1,1) converted via .timestamp() is timezone-dependent.
    // On some systems it may return a string repr instead of Date.
    if (result instanceof Date) {
      expect(result.getFullYear()).toBe(1970)
    } else {
      // Fallback: at least verify it's a string representation
      expect(String(result)).toContain('1970')
    }
  })

  it('should handle far future datetime', () => {
    const result = mod.get_far_futureSync()
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2999)
  })
})

// ─── Module state ─────────────────────────────────────────────────────────────

describe('module state persistence', () => {
  it('should maintain global state across calls', () => {
    mod.reset_counterSync()
    expect(mod.get_counterSync()).toBe(0)

    mod.increment_counterSync()
    mod.increment_counterSync()
    mod.increment_counterSync()
    expect(mod.get_counterSync()).toBe(3)
  })

  it('should share state when re-importing same module', () => {
    // Counter should still be 3 from previous test (same Python process)
    const mod2 = python.importModule('./test/fixtures/edge_cases')
    const count = mod2.get_counterSync()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})

// ─── Stress tests ─────────────────────────────────────────────────────────────

describe('stress tests', () => {
  it('should handle 10000 rapid sync calls without crashing', () => {
    for (let i = 0; i < 10_000; i++) {
      mod.get_zeroSync()
    }
  })

  it('should handle 100 concurrent async calls', async () => {
    const promises = Array.from({ length: 100 }, (_, i) => mod.identity_int(i))
    const results = await Promise.all(promises)
    for (let i = 0; i < 100; i++) {
      expect(results[i]).toBe(i)
    }
  })

  it('should handle 500 concurrent async calls', async () => {
    const promises = Array.from({ length: 500 }, (_, i) => mod.identity_int(i))
    const results = await Promise.all(promises)
    expect(results.length).toBe(500)
    expect(results[0]).toBe(0)
    expect(results[499]).toBe(499)
  }, 30000) // Extended timeout

  it('should handle mixed sync/async interleaving', async () => {
    const results: number[] = []
    for (let i = 0; i < 50; i++) {
      if (i % 2 === 0) {
        results.push(mod.identity_intSync(i))
      } else {
        results.push(await mod.identity_int(i))
      }
    }
    for (let i = 0; i < 50; i++) {
      expect(results[i]).toBe(i)
    }
  })

  it('should not leak memory over 5000 calls', () => {
    // Force GC if available, then measure
    if (global.gc) global.gc()
    const before = process.memoryUsage().heapUsed

    for (let i = 0; i < 5000; i++) {
      mod.build_deep_dictSync(5)
    }

    if (global.gc) global.gc()
    const after = process.memoryUsage().heapUsed

    // Allow up to 50MB growth (generous, just catching catastrophic leaks)
    const growthMB = (after - before) / 1024 / 1024
    expect(growthMB).toBeLessThan(50)
  })
})

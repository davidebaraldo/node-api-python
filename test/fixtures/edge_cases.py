"""Test fixture for edge cases — BigInt, deep nesting, special values, errors."""

import sys
import datetime


# --- BigInt edge cases ---

def get_max_safe_int():
    """2^53 — JS Number.MAX_SAFE_INTEGER."""
    return 2**53

def get_above_safe_int():
    """2^53 + 1 — should become BigInt in JS."""
    return 2**53 + 1

def get_very_large_int():
    """2^128 — multi-word BigInt."""
    return 2**128

def get_negative_big_int():
    """Negative BigInt."""
    return -(2**64)

def get_zero():
    return 0

def identity_int(x):
    """Round-trip an integer."""
    return x


# --- Deep nesting ---

def build_deep_dict(depth):
    """Build a dict nested to the given depth."""
    obj = {"value": "leaf"}
    for i in range(depth):
        obj = {"child": obj, "level": i}
    return obj

def build_deep_list(depth):
    """Build a list nested to the given depth."""
    obj = [42]
    for _ in range(depth):
        obj = [obj]
    return obj

def build_mixed_nested(depth):
    """Alternating dict/list nesting."""
    obj = {"v": True}
    for i in range(depth):
        if i % 2 == 0:
            obj = [obj, i]
        else:
            obj = {"d": obj, "i": i}
    return obj


# --- Special float values ---

def get_nan():
    return float('nan')

def get_inf():
    return float('inf')

def get_neg_inf():
    return float('-inf')

def get_neg_zero():
    return -0.0


# --- Collections with mixed types ---

def get_mixed_list():
    return [1, "two", 3.0, True, None, [4, 5], {"k": "v"}]

def get_dict_with_none_values():
    return {"a": 1, "b": None, "c": "three", "d": None}

def get_list_with_nones():
    return [None, 1, None, "x", None]


# --- Error edge cases ---

def raise_runtime_error():
    raise RuntimeError("runtime error from Python")

def raise_key_error():
    d = {}
    return d["missing"]

def raise_attribute_error():
    class Foo:
        pass
    return Foo().nonexistent

def raise_recursion_error():
    def recurse():
        recurse()
    recurse()

def raise_in_nested_call():
    """Error deep in call stack."""
    def inner():
        def innermost():
            raise ValueError("deep error")
        innermost()
    inner()

def raise_with_unicode():
    raise ValueError("errore con unicode: àèìòù 日本語 🔥")


# --- String edge cases ---

def get_empty_string():
    return ""

def get_null_bytes_string():
    return "hello\x00world"

def get_long_string(n):
    return "x" * n


# --- Bytes edge cases ---

def get_all_bytes():
    """All byte values 0x00-0xFF."""
    return bytes(range(256))

def get_empty_bytes():
    return b""

def get_large_bytes(n):
    return b"\xAB" * n


# --- Datetime edge cases ---

def get_datetime_with_microseconds():
    return datetime.datetime(2025, 6, 15, 12, 30, 45, 123456)

def get_epoch():
    return datetime.datetime(1970, 1, 1, 0, 0, 0)

def get_far_future():
    return datetime.datetime(2999, 12, 31, 23, 59, 59)


# --- Import/module edge cases ---

GLOBAL_COUNTER = 0

def increment_counter():
    global GLOBAL_COUNTER
    GLOBAL_COUNTER += 1
    return GLOBAL_COUNTER

def get_counter():
    return GLOBAL_COUNTER

def reset_counter():
    global GLOBAL_COUNTER
    GLOBAL_COUNTER = 0

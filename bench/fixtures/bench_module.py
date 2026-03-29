"""Benchmark fixtures for node-api-python."""

import datetime


# --- Primitives ---

def noop():
    """Minimal function — measures pure call overhead."""
    pass


def add(a, b):
    return a + b


def echo_string(s):
    return s


# --- Collections ---

def build_list(n):
    return list(range(n))


def sum_list(items):
    return sum(items)


def build_dict(n):
    return {f"k{i}": i for i in range(n)}


def merge_dicts(a, b):
    return {**a, **b}


def build_nested(depth):
    obj = {"value": 0}
    for i in range(depth):
        obj = {"child": obj, "level": i}
    return obj


# --- NumPy (optional) ---

try:
    import numpy as _np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def has_numpy():
    return HAS_NUMPY


def numpy_sum(arr):
    return float(_np.sum(arr))


def numpy_multiply(arr, scalar):
    return _np.asarray(arr) * scalar


def numpy_create(n):
    return _np.arange(n, dtype=_np.float64)


# --- Callbacks ---

def call_n_times(cb, n):
    for i in range(n):
        cb(i)
    return n


def transform_list(items, fn):
    return [fn(x) for x in items]


# --- CPU work ---

def cpu_fib(n):
    """Fibonacci via iteration — calibrated CPU work."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def cpu_sum_squares(n):
    return sum(i * i for i in range(n))


# --- Datetime ---

def make_datetime():
    return datetime.datetime(2025, 6, 15, 12, 30, 45)


def roundtrip_datetime(dt):
    return dt

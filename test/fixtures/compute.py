"""Test fixture for sync/async calling patterns."""

import time


def add(a, b):
    return a + b


def slow_add(a, b):
    time.sleep(0.1)
    return a + b


def raises_error():
    raise ValueError("test error from Python")


def division(a, b):
    return a / b  # can raise ZeroDivisionError


def raises_type_error():
    raise TypeError("wrong type from Python")


def cpu_intensive(n):
    """Compute sum of squares up to n."""
    return sum(i * i for i in range(n))

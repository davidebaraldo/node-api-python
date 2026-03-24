"""Validate that all test fixtures work correctly as standalone Python modules.

These tests ensure the Python fixture files used by the JS test suite are
correct on their own, independent of the Node.js bridge.
"""

import importlib
import sys
from pathlib import Path

import pytest

# Add the fixtures directory to sys.path
fixtures_dir = str(Path(__file__).resolve().parent.parent / "fixtures")
if fixtures_dir not in sys.path:
    sys.path.insert(0, fixtures_dir)


# ---------------------------------------------------------------------------
# type_test.py
# ---------------------------------------------------------------------------


class TestTypeTestFixture:
    """Validate test/fixtures/type_test.py."""

    @pytest.fixture(autouse=True)
    def _load_module(self):
        self.mod = importlib.import_module("type_test")

    def test_identity_returns_input(self):
        assert self.mod.identity(42) == 42
        assert self.mod.identity("hello") == "hello"
        assert self.mod.identity(None) is None
        assert self.mod.identity([1, 2]) == [1, 2]

    def test_get_int(self):
        result = self.mod.get_int()
        assert result == 42
        assert isinstance(result, int)

    def test_get_float(self):
        result = self.mod.get_float()
        assert abs(result - 3.14) < 1e-10
        assert isinstance(result, float)

    def test_get_str(self):
        result = self.mod.get_str()
        assert result == "hello"
        assert isinstance(result, str)

    def test_get_bool(self):
        result = self.mod.get_bool()
        assert result is True
        assert isinstance(result, bool)

    def test_get_none(self):
        result = self.mod.get_none()
        assert result is None

    def test_get_list(self):
        result = self.mod.get_list()
        assert result == [1, 2, 3]
        assert isinstance(result, list)

    def test_get_dict(self):
        result = self.mod.get_dict()
        assert result == {"a": 1, "b": 2}
        assert isinstance(result, dict)

    def test_get_nested(self):
        result = self.mod.get_nested()
        assert result == {"list": [1, {"nested": True}], "num": 42}

    def test_get_bytes(self):
        result = self.mod.get_bytes()
        assert result == b"hello"
        assert isinstance(result, bytes)

    def test_get_set(self):
        result = self.mod.get_set()
        assert result == {1, 2, 3}
        assert isinstance(result, set)

    def test_get_tuple(self):
        result = self.mod.get_tuple()
        assert result == (1, "two", 3.0)
        assert isinstance(result, tuple)

    def test_get_big_int(self):
        result = self.mod.get_big_int()
        assert result == 2**64
        assert isinstance(result, int)

    def test_get_empty_list(self):
        assert self.mod.get_empty_list() == []

    def test_get_empty_dict(self):
        assert self.mod.get_empty_dict() == {}

    def test_get_empty_set(self):
        assert self.mod.get_empty_set() == set()

    def test_get_unicode_str(self):
        result = self.mod.get_unicode_str()
        assert "\u4e16\u754c" in result
        assert isinstance(result, str)

    def test_get_datetime(self):
        import datetime

        result = self.mod.get_datetime()
        assert isinstance(result, datetime.datetime)
        assert result.year == 2025
        assert result.month == 6
        assert result.day == 15

    def test_add_ints(self):
        assert self.mod.add_ints(3, 7) == 10
        assert self.mod.add_ints(0, 0) == 0
        assert self.mod.add_ints(-5, 5) == 0

    def test_concat_strings(self):
        assert self.mod.concat_strings("hello", " world") == "hello world"
        assert self.mod.concat_strings("", "") == ""

    def test_sum_list(self):
        assert self.mod.sum_list([1, 2, 3, 4, 5]) == 15
        assert self.mod.sum_list([]) == 0
        assert self.mod.sum_list([0.5, 0.5]) == 1.0

    def test_merge_dicts(self):
        assert self.mod.merge_dicts({"a": 1}, {"b": 2}) == {"a": 1, "b": 2}
        assert self.mod.merge_dicts({"a": 1}, {"a": 2}) == {"a": 2}

    def test_get_deeply_nested(self):
        result = self.mod.get_deeply_nested()
        assert result["level1"]["level2"]["level3"] == [1, 2, {"level4": True}]
        assert result["sibling"] == "value"

    def test_accept_and_return_list(self):
        assert self.mod.accept_and_return_list([1, 2, 3]) == [3, 2, 1]
        assert self.mod.accept_and_return_list([]) == []

    def test_accept_and_return_dict(self):
        result = self.mod.accept_and_return_dict({"x": 5, "y": 10})
        assert result == {"x": 10, "y": 20}

    def test_identity_with_large_number(self):
        big = 10**100
        assert self.mod.identity(big) == big

    def test_identity_with_unicode(self):
        text = "\u00e9\u00e0\u00fc \u4f60\u597d \U0001f680"
        assert self.mod.identity(text) == text


# ---------------------------------------------------------------------------
# compute.py
# ---------------------------------------------------------------------------


class TestComputeFixture:
    """Validate test/fixtures/compute.py."""

    @pytest.fixture(autouse=True)
    def _load_module(self):
        self.mod = importlib.import_module("compute")

    def test_add(self):
        assert self.mod.add(2, 3) == 5
        assert self.mod.add(0, 0) == 0
        assert self.mod.add(-1, 1) == 0

    def test_add_floats(self):
        result = self.mod.add(1.5, 2.5)
        assert abs(result - 4.0) < 1e-10

    def test_add_strings(self):
        assert self.mod.add("hello", " world") == "hello world"

    def test_slow_add(self):
        import time

        start = time.time()
        result = self.mod.slow_add(5, 10)
        elapsed = time.time() - start
        assert result == 15
        assert elapsed >= 0.08  # at least ~100ms

    def test_raises_error(self):
        with pytest.raises(ValueError, match="test error from Python"):
            self.mod.raises_error()

    def test_division(self):
        assert self.mod.division(10, 2) == 5.0
        assert abs(self.mod.division(22, 7) - 3.142857) < 0.001

    def test_division_by_zero(self):
        with pytest.raises(ZeroDivisionError):
            self.mod.division(1, 0)

    def test_raises_type_error(self):
        with pytest.raises(TypeError, match="wrong type from Python"):
            self.mod.raises_type_error()

    def test_cpu_intensive(self):
        result = self.mod.cpu_intensive(100)
        expected = sum(i * i for i in range(100))
        assert result == expected
        assert result == 328350

    def test_cpu_intensive_zero(self):
        assert self.mod.cpu_intensive(0) == 0


# ---------------------------------------------------------------------------
# callbacks.py
# ---------------------------------------------------------------------------


class TestCallbacksFixture:
    """Validate test/fixtures/callbacks.py."""

    @pytest.fixture(autouse=True)
    def _load_module(self):
        self.mod = importlib.import_module("callbacks")

    def test_call_callback(self):
        received = []
        result = self.mod.call_callback(lambda x: received.append(x))
        assert result == "done"
        assert received == [42]

    def test_call_callback_multiple(self):
        received = []
        result = self.mod.call_callback_multiple(lambda x: received.append(x), 5)
        assert result == 5
        assert received == [0, 1, 2, 3, 4]

    def test_call_callback_multiple_zero(self):
        received = []
        result = self.mod.call_callback_multiple(lambda x: received.append(x), 0)
        assert result == 0
        assert received == []

    def test_with_progress(self):
        progress = []
        result = self.mod.with_progress(
            ["a", "b", "c", "d", "e"],
            lambda pct: progress.append(pct),
        )
        assert result == {"processed": 5}
        assert progress == [20, 40, 60, 80, 100]

    def test_with_progress_single_item(self):
        progress = []
        self.mod.with_progress(["x"], lambda pct: progress.append(pct))
        assert progress == [100]

    def test_event_source(self):
        source = self.mod.EventSource()
        data_events = []
        done_value = []

        source.on("data", lambda v: data_events.append(v))
        source.on("done", lambda v: done_value.append(v))
        source.run(3)

        assert data_events == [0, 1, 2]
        assert done_value == [3]

    def test_event_source_zero_events(self):
        source = self.mod.EventSource()
        data_events = []

        source.on("data", lambda v: data_events.append(v))
        source.run(0)

        assert data_events == []

    def test_event_source_multiple_listeners(self):
        source = self.mod.EventSource()
        log1 = []
        log2 = []

        source.on("data", lambda v: log1.append(v))
        source.on("data", lambda v: log2.append(v))
        source.run(2)

        assert log1 == [0, 1]
        assert log2 == [0, 1]

    def test_create_event_source(self):
        source = self.mod.create_event_source()
        assert isinstance(source, self.mod.EventSource)

    def test_generate_items(self):
        items = list(self.mod.generate_items(3))
        assert items == [
            {"index": 0, "value": 0},
            {"index": 1, "value": 2},
            {"index": 2, "value": 4},
        ]

    def test_generate_items_zero(self):
        items = list(self.mod.generate_items(0))
        assert items == []

    def test_callback_with_error(self):
        def bad_cb(_):
            raise RuntimeError("boom")

        with pytest.raises(RuntimeError, match="boom"):
            self.mod.callback_with_error(bad_cb)

    def test_transform_with_callback(self):
        result = self.mod.transform_with_callback([1, 2, 3], lambda x: x * 10)
        assert result == [10, 20, 30]

    def test_transform_with_callback_strings(self):
        result = self.mod.transform_with_callback(
            ["hello", "world"], lambda s: s.upper()
        )
        assert result == ["HELLO", "WORLD"]

    def test_transform_with_callback_empty(self):
        result = self.mod.transform_with_callback([], lambda x: x)
        assert result == []

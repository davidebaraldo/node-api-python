"""Test fixture for type marshaling between JS and Python."""

import datetime


def identity(x):
    """Return the input unchanged -- for testing type roundtrips."""
    return x


def get_int() -> int:
    return 42


def get_float() -> float:
    return 3.14


def get_str() -> str:
    return "hello"


def get_bool() -> bool:
    return True


def get_none() -> None:
    return None


def get_list() -> list:
    return [1, 2, 3]


def get_dict() -> dict:
    return {"a": 1, "b": 2}


def get_nested() -> dict:
    return {"list": [1, {"nested": True}], "num": 42}


def get_bytes() -> bytes:
    return b"hello"


def get_set() -> set:
    return {1, 2, 3}


def get_tuple() -> tuple:
    return (1, "two", 3.0)


def get_big_int() -> int:
    return 2**64


def get_empty_list() -> list:
    return []


def get_empty_dict() -> dict:
    return {}


def get_empty_set() -> set:
    return set()


def get_unicode_str() -> str:
    return "hello \u4e16\u754c \ud83c\udf0d"


def get_datetime() -> datetime.datetime:
    return datetime.datetime(2025, 6, 15, 12, 30, 45)


def add_ints(a: int, b: int) -> int:
    return a + b


def concat_strings(a: str, b: str) -> str:
    return a + b


def sum_list(items: list) -> float:
    return sum(items)


def merge_dicts(a: dict, b: dict) -> dict:
    return {**a, **b}


def get_deeply_nested() -> dict:
    return {
        "level1": {
            "level2": {
                "level3": [1, 2, {"level4": True}],
            },
        },
        "sibling": "value",
    }


def accept_and_return_list(items: list) -> list:
    return list(reversed(items))


def accept_and_return_dict(d: dict) -> dict:
    return {k: v * 2 if isinstance(v, (int, float)) else v for k, v in d.items()}

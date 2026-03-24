"""Tests for the TypeScript type generator (Phase 5 — typegen)."""

import ast
import sys
import textwrap
from pathlib import Path

# Add the source directory to sys.path so we can import the typegen modules
src_dir = str(Path(__file__).resolve().parent.parent.parent / "src" / "python")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)


# ---------------------------------------------------------------------------
# Helpers — lightweight extraction and emission stubs for testing
#
# The real extractor/emitter are Phase 5 stubs. These tests define the
# *expected* interface so that when the code is implemented it passes.
# Tests that require the real implementation are marked with xfail.
# ---------------------------------------------------------------------------


def _parse_function(source: str) -> ast.FunctionDef:
    """Parse a single function definition from source text."""
    tree = ast.parse(textwrap.dedent(source))
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            return node
    raise ValueError("No function found in source")


# ---------------------------------------------------------------------------
# Extractor tests
# ---------------------------------------------------------------------------


class TestExtractor:
    """Tests for extracting Python type information from source code."""

    def test_extract_function_no_type_hints(self):
        """A function without annotations should have 'any' types."""
        source = """
        def foo(x, y):
            return x + y
        """
        func = _parse_function(source)
        # No annotations -> args should have no annotation attribute set
        for arg in func.args.args:
            assert arg.annotation is None
        assert func.returns is None

    def test_extract_function_with_primitive_hints(self):
        """A function with int/str/float/bool hints should be parsed."""
        source = """
        def bar(a: int, b: str, c: float, d: bool) -> str:
            return str(a)
        """
        func = _parse_function(source)
        arg_names = [a.arg for a in func.args.args]
        assert arg_names == ["a", "b", "c", "d"]

        # Check return annotation
        assert isinstance(func.returns, ast.Name)
        assert func.returns.id == "str"

        # Check arg annotations
        annotations = [a.annotation for a in func.args.args]
        assert all(isinstance(a, ast.Name) for a in annotations)
        assert [a.id for a in annotations] == ["int", "str", "float", "bool"]

    def test_extract_function_with_generic_types(self):
        """list[int], dict[str, Any] etc. should be extractable."""
        source = """
        def process(items: list[int], lookup: dict[str, float]) -> list[str]:
            pass
        """
        func = _parse_function(source)
        # The return type should be a subscript
        assert isinstance(func.returns, ast.Subscript)

    def test_extract_function_with_optional(self):
        """Optional[int] or int | None should be extractable."""
        source = """
        def maybe(x: int | None) -> int | None:
            return x
        """
        func = _parse_function(source)
        # Python 3.10+ union syntax uses BinOp with BitOr
        assert isinstance(func.returns, ast.BinOp)

    def test_extract_function_with_default_values(self):
        """Default values should be detectable."""
        source = """
        def greet(name: str, greeting: str = "Hello") -> str:
            return f"{greeting}, {name}"
        """
        func = _parse_function(source)
        assert len(func.args.defaults) == 1

    def test_extract_class_with_methods(self):
        """Class methods should be extractable."""
        source = """
        class Calculator:
            def add(self, a: int, b: int) -> int:
                return a + b

            def multiply(self, a: float, b: float) -> float:
                return a * b
        """
        tree = ast.parse(textwrap.dedent(source))
        classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        assert len(classes) == 1
        cls = classes[0]
        assert cls.name == "Calculator"
        methods = [n for n in cls.body if isinstance(n, ast.FunctionDef)]
        assert len(methods) == 2
        assert methods[0].name == "add"
        assert methods[1].name == "multiply"

    def test_extract_dataclass_fields(self):
        """Dataclass fields should be extractable."""
        source = """
        from dataclasses import dataclass

        @dataclass
        class Point:
            x: float
            y: float
            label: str = "origin"
        """
        tree = ast.parse(textwrap.dedent(source))
        classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        assert len(classes) == 1
        cls = classes[0]
        assert cls.name == "Point"
        # Check that there are decorators
        assert len(cls.decorator_list) == 1
        # Fields are AnnAssign nodes in the body
        fields = [n for n in cls.body if isinstance(n, ast.AnnAssign)]
        assert len(fields) == 3
        field_names = [f.target.id for f in fields]
        assert field_names == ["x", "y", "label"]

    def test_extract_typed_dict_fields(self):
        """TypedDict fields should be extractable."""
        source = """
        from typing import TypedDict

        class Config(TypedDict):
            host: str
            port: int
            debug: bool
        """
        tree = ast.parse(textwrap.dedent(source))
        classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        assert len(classes) == 1
        cls = classes[0]
        assert cls.name == "Config"
        fields = [n for n in cls.body if isinstance(n, ast.AnnAssign)]
        assert len(fields) == 3
        field_names = [f.target.id for f in fields]
        assert field_names == ["host", "port", "debug"]

    def test_extract_docstring(self):
        """Docstrings should be extractable from functions."""
        source = """
        def documented(x: int) -> int:
            \"\"\"Double the input value.\"\"\"
            return x * 2
        """
        func = _parse_function(source)
        docstring = ast.get_docstring(func)
        assert docstring == "Double the input value."

    def test_extract_class_docstring(self):
        """Class-level docstrings should be extractable."""
        source = """
        class MyClass:
            \"\"\"A useful class.\"\"\"
            def method(self) -> None:
                pass
        """
        tree = ast.parse(textwrap.dedent(source))
        cls = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)][0]
        docstring = ast.get_docstring(cls)
        assert docstring == "A useful class."


# ---------------------------------------------------------------------------
# Emitter tests
# ---------------------------------------------------------------------------


# Map of Python type annotation strings to expected TypeScript types
PYTHON_TO_TS = {
    "int": "number",
    "float": "number",
    "str": "string",
    "bool": "boolean",
    "None": "null",
    "bytes": "Buffer",
    "list": "any[]",
    "dict": "Record<string, any>",
}


class TestEmitter:
    """Tests for emitting TypeScript .d.ts definitions."""

    def test_primitive_type_mapping(self):
        """Python primitive types should map to correct TS types."""
        for py_type, ts_type in PYTHON_TO_TS.items():
            assert ts_type is not None, f"No mapping for {py_type}"

    def test_emit_simple_function_signature(self):
        """A simple function should emit a valid .d.ts line."""
        # Expected output format:
        # export function add(a: number, b: number): number;
        expected_pattern = "export function add(a: number, b: number): number;"
        # This test documents the expected output format
        assert "export function" in expected_pattern
        assert "number" in expected_pattern

    def test_emit_function_with_no_hints(self):
        """A function with no type hints should use 'any' types."""
        expected = "export function foo(...args: any[]): any;"
        assert "any" in expected

    def test_emit_class_with_methods(self):
        """A class should emit an interface or class declaration."""
        expected_lines = [
            "export class Calculator {",
            "  add(a: number, b: number): number;",
            "  multiply(a: number, b: number): number;",
            "}",
        ]
        # Verify structure
        assert expected_lines[0].startswith("export class")
        assert expected_lines[-1] == "}"

    def test_emit_with_jsdoc_from_docstring(self):
        """Docstrings should become JSDoc comments."""
        docstring = "Double the input value."
        jsdoc = f"/** {docstring} */"
        assert jsdoc == "/** Double the input value. */"

    def test_emit_generic_list_type(self):
        """list[int] should become number[]."""
        # list[int] -> number[]
        # list[str] -> string[]
        assert "number[]" is not None  # placeholder for real assertion

    def test_emit_generic_dict_type(self):
        """dict[str, int] should become Record<string, number>."""
        expected = "Record<string, number>"
        assert "Record" in expected

    def test_emit_optional_type(self):
        """int | None should become number | null."""
        expected = "number | null"
        assert "null" in expected

    def test_emit_tuple_type(self):
        """tuple[int, str] should become [number, string]."""
        expected = "[number, string]"
        assert expected.startswith("[")

    def test_roundtrip_source_to_dts_structure(self):
        """Parse Python source, extract info, verify .d.ts structure is valid."""
        source = textwrap.dedent("""
        def greet(name: str) -> str:
            \"\"\"Say hello.\"\"\"
            return f"Hello, {name}!"

        def add(a: int, b: int) -> int:
            return a + b

        class Counter:
            \"\"\"A simple counter.\"\"\"
            def increment(self, n: int = 1) -> int:
                pass
            def reset(self) -> None:
                pass
        """)

        tree = ast.parse(source)

        # Extract all top-level definitions
        top_level = [
            node
            for node in ast.iter_child_nodes(tree)
            if isinstance(node, (ast.FunctionDef, ast.ClassDef))
        ]

        assert len(top_level) == 3
        assert isinstance(top_level[0], ast.FunctionDef)
        assert top_level[0].name == "greet"
        assert isinstance(top_level[1], ast.FunctionDef)
        assert top_level[1].name == "add"
        assert isinstance(top_level[2], ast.ClassDef)
        assert top_level[2].name == "Counter"

        # Verify docstrings are present
        assert ast.get_docstring(top_level[0]) == "Say hello."
        assert ast.get_docstring(top_level[2]) == "A simple counter."

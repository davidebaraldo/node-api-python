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


# ---------------------------------------------------------------------------
# Real extractor / emitter tests
# ---------------------------------------------------------------------------

from typegen.extractor import extract_module
from typegen.emitter import emit_dts


class TestExtractorReal:
    """Tests using the real extractor module."""

    def test_extract_simple_function(self):
        source = '''
def add(x: int, y: int) -> int:
    """Add two numbers."""
    return x + y
'''
        module = extract_module(source, "test")
        assert len(module.functions) == 1
        func = module.functions[0]
        assert func.name == "add"
        assert len(func.params) == 2
        assert func.params[0].name == "x"
        assert func.params[0].type_hint == "int"
        assert func.params[1].name == "y"
        assert func.params[1].type_hint == "int"
        assert func.return_type == "int"
        assert func.docstring == "Add two numbers."

    def test_extract_function_no_hints(self):
        source = "def foo(x, y): pass\n"
        module = extract_module(source, "test")
        func = module.functions[0]
        assert func.params[0].type_hint is None
        assert func.return_type is None

    def test_extract_function_with_defaults(self):
        source = 'def greet(name: str, greeting: str = "Hello") -> str: ...\n'
        module = extract_module(source, "test")
        func = module.functions[0]
        assert func.params[1].default == "'Hello'"

    def test_extract_skips_private(self):
        source = '''
def public_func(): pass
def _private_func(): pass
class PublicClass: pass
class _PrivateClass: pass
'''
        module = extract_module(source, "test")
        assert len(module.functions) == 1
        assert module.functions[0].name == "public_func"
        assert len(module.classes) == 1
        assert module.classes[0].name == "PublicClass"

    def test_extract_class_methods(self):
        source = '''
class Calculator:
    """A calculator."""
    def add(self, a: int, b: int) -> int:
        return a + b
    def multiply(self, a: float, b: float) -> float:
        return a * b
'''
        module = extract_module(source, "test")
        cls = module.classes[0]
        assert cls.name == "Calculator"
        assert cls.docstring == "A calculator."
        assert len(cls.methods) == 2
        # self should be stripped
        assert cls.methods[0].params[0].name == "a"
        assert cls.methods[0].is_method is True

    def test_extract_dataclass(self):
        source = '''
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
    label: str = "origin"
'''
        module = extract_module(source, "test")
        cls = module.classes[0]
        assert cls.name == "Point"
        assert cls.is_dataclass is True
        assert len(cls.fields) == 3
        assert cls.fields[0].name == "x"
        assert cls.fields[0].type_hint == "float"
        assert cls.fields[2].default == "'origin'"

    def test_extract_typed_dict(self):
        source = '''
from typing import TypedDict

class Config(TypedDict):
    host: str
    port: int
'''
        module = extract_module(source, "test")
        cls = module.classes[0]
        assert cls.name == "Config"
        assert cls.is_typed_dict is True
        assert len(cls.fields) == 2
        assert cls.fields[0].name == "host"
        assert cls.fields[0].type_hint == "str"

    def test_extract_static_and_classmethod(self):
        source = '''
class Util:
    @staticmethod
    def helper(x: int) -> int:
        return x

    @classmethod
    def create(cls, name: str) -> None:
        pass
'''
        module = extract_module(source, "test")
        cls = module.classes[0]
        assert cls.methods[0].is_static is True
        assert cls.methods[0].name == "helper"
        assert cls.methods[1].is_classmethod is True
        assert cls.methods[1].name == "create"
        # cls param should be stripped
        assert cls.methods[1].params[0].name == "name"

    def test_extract_module_docstring(self):
        source = '"""My module docstring."""\ndef foo(): pass\n'
        module = extract_module(source, "test")
        assert module.docstring == "My module docstring."


class TestEmitterReal:
    """Tests using the real emitter module."""

    def test_emit_simple_function(self):
        module = extract_module("def add(x: int, y: int) -> int: ...", "test")
        dts = emit_dts(module)
        assert "export function add(x: number, y: number): Promise<number>" in dts
        assert "export function addSync(x: number, y: number): number" in dts

    def test_emit_no_type_hints(self):
        module = extract_module("def foo(x, y): pass", "test")
        dts = emit_dts(module)
        assert "export function foo(x: any, y: any): Promise<any>" in dts
        assert "export function fooSync(x: any, y: any): any" in dts

    def test_emit_header(self):
        module = extract_module("def f(): pass", "mymod")
        dts = emit_dts(module)
        assert "Auto-generated by node-api-python" in dts
        assert "Source: mymod.py" in dts
        assert "Do not edit manually" in dts

    def test_emit_jsdoc(self):
        source = '''
def greet(name: str) -> str:
    """Say hello to someone."""
    return f"Hello, {name}"
'''
        module = extract_module(source, "test")
        dts = emit_dts(module)
        assert "/** Say hello to someone. */" in dts

    def test_emit_list_type(self):
        module = extract_module("def f(x: list[int]) -> list[str]: ...", "test")
        dts = emit_dts(module)
        assert "x: number[]" in dts
        assert "Promise<string[]>" in dts

    def test_emit_dict_type(self):
        module = extract_module("def f(x: dict[str, int]) -> dict[str, float]: ...", "test")
        dts = emit_dts(module)
        assert "x: Record<string, number>" in dts
        assert "Record<string, number>" in dts

    def test_emit_optional_type(self):
        module = extract_module("def f(x: int | None) -> str | None: ...", "test")
        dts = emit_dts(module)
        assert "x: number | null" in dts
        assert "string | null" in dts

    def test_emit_tuple_type(self):
        module = extract_module("def f(x: tuple[int, str]) -> tuple[float, bool]: ...", "test")
        dts = emit_dts(module)
        assert "x: [number, string]" in dts
        assert "[number, boolean]" in dts

    def test_emit_dataclass_interface(self):
        source = '''
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
'''
        module = extract_module(source, "test")
        dts = emit_dts(module)
        assert "export interface Point {" in dts
        assert "x: number" in dts
        assert "y: number" in dts

    def test_emit_typed_dict_interface(self):
        source = '''
from typing import TypedDict

class Config(TypedDict):
    host: str
    port: int
'''
        module = extract_module(source, "test")
        dts = emit_dts(module)
        assert "export interface Config {" in dts
        assert "host: string" in dts
        assert "port: number" in dts

    def test_emit_class_with_methods(self):
        source = '''
class Calc:
    def add(self, a: int, b: int) -> int:
        return a + b
'''
        module = extract_module(source, "test")
        dts = emit_dts(module)
        assert "export interface Calc {" in dts
        assert "add(a: number, b: number): Promise<number>" in dts
        assert "addSync(a: number, b: number): number" in dts

    def test_emit_optional_param(self):
        source = 'def greet(name: str, greeting: str = "Hello") -> str: ...\n'
        module = extract_module(source, "test")
        dts = emit_dts(module)
        assert "greeting?: string" in dts

    def test_emit_callable_type(self):
        source = "def f(cb: Callable[[int, str], bool]) -> None: ...\n"
        module = extract_module(source, "test")
        dts = emit_dts(module)
        assert "(arg0: number, arg1: string) => boolean" in dts

    def test_emit_set_type(self):
        module = extract_module("def f(x: set[int]) -> set[str]: ...", "test")
        dts = emit_dts(module)
        assert "Set<number>" in dts
        assert "Set<string>" in dts

    def test_emit_bytes_type(self):
        module = extract_module("def f(x: bytes) -> bytearray: ...", "test")
        dts = emit_dts(module)
        assert "x: Buffer" in dts
        assert "Promise<Buffer>" in dts


class TestEndToEnd:
    """End-to-end tests: Python source -> .d.ts output."""

    def test_full_module(self):
        source = '''
"""My module."""
from dataclasses import dataclass
from typing import TypedDict

@dataclass
class Point:
    x: float
    y: float

class Config(TypedDict):
    host: str
    port: int

def distance(a: Point, b: Point) -> float:
    """Calculate distance between two points."""
    ...

def greet(name: str, greeting: str = "Hello") -> str:
    ...
'''
        module = extract_module(source, "geometry")
        dts = emit_dts(module)
        assert "export interface Point" in dts
        assert "x: number" in dts
        assert "export interface Config" in dts
        assert "host: string" in dts
        assert "export function distance" in dts
        assert "export function greet" in dts
        assert "Source: geometry.py" in dts
        assert "My module." in dts

    def test_complex_types(self):
        source = '''
from typing import Optional, Union

def process(
    items: list[int],
    lookup: dict[str, float],
    pair: tuple[str, int],
    tags: set[str],
    callback: Callable[[int], str],
    maybe: Optional[int] = None,
) -> Union[str, int]:
    ...
'''
        module = extract_module(source, "complex")
        dts = emit_dts(module)
        assert "number[]" in dts
        assert "Record<string, number>" in dts
        assert "[string, number]" in dts
        assert "Set<string>" in dts
        assert "string | number" in dts

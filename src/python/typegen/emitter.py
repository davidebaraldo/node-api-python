"""Emit TypeScript .d.ts definitions from extracted Python type information."""

from __future__ import annotations

import re

from .extractor import ClassInfo, FunctionInfo, ModuleInfo, ParamInfo

# Mapping of Python primitive type names to TypeScript equivalents
_PRIMITIVE_MAP: dict[str, str] = {
    "int": "number",
    "float": "number",
    "str": "string",
    "bool": "boolean",
    "None": "null",
    "NoneType": "null",
    "Any": "unknown",
    "bytes": "Buffer",
    "bytearray": "Buffer",
    "datetime": "Date",
    "date": "Date",
}


def _map_type(py_type: str | None) -> str:
    """Convert a Python type annotation string to a TypeScript type string."""
    if py_type is None:
        return "any"

    py_type = py_type.strip()

    # Handle primitives
    if py_type in _PRIMITIVE_MAP:
        return _PRIMITIVE_MAP[py_type]

    # Handle Union[A, B] syntax
    union_match = re.match(r"^Union\[(.+)\]$", py_type)
    if union_match:
        inner = _split_type_args(union_match.group(1))
        return " | ".join(_map_type(t) for t in inner)

    # Handle Optional[T] -> T | null
    optional_match = re.match(r"^Optional\[(.+)\]$", py_type)
    if optional_match:
        inner = optional_match.group(1).strip()
        return f"{_map_type(inner)} | null"

    # Handle Python 3.10+ union syntax: A | B
    if " | " in py_type:
        parts = py_type.split(" | ")
        return " | ".join(_map_type(p.strip()) for p in parts)

    # Handle list[T] -> T[]
    list_match = re.match(r"^list\[(.+)\]$", py_type)
    if list_match:
        inner = list_match.group(1).strip()
        mapped = _map_type(inner)
        # Wrap union types in parens for array syntax
        if " | " in mapped:
            return f"({mapped})[]"
        return f"{mapped}[]"

    # Handle bare list
    if py_type == "list":
        return "any[]"

    # Handle dict[K, V] -> Record<K, V>
    dict_match = re.match(r"^dict\[(.+)\]$", py_type)
    if dict_match:
        args = _split_type_args(dict_match.group(1))
        if len(args) == 2:
            return f"Record<{_map_type(args[0])}, {_map_type(args[1])}>"
        return "Record<string, any>"

    # Handle bare dict
    if py_type == "dict":
        return "Record<string, any>"

    # Handle tuple[A, B, C] -> [A, B, C]
    tuple_match = re.match(r"^tuple\[(.+)\]$", py_type)
    if tuple_match:
        args = _split_type_args(tuple_match.group(1))
        return "[" + ", ".join(_map_type(t) for t in args) + "]"

    # Handle set[T] -> Set<T>
    set_match = re.match(r"^set\[(.+)\]$", py_type)
    if set_match:
        inner = set_match.group(1).strip()
        return f"Set<{_map_type(inner)}>"

    # Handle Callable[[A, B], R] -> (arg0: A, arg1: B) => R
    callable_match = re.match(r"^Callable\[(.+)\]$", py_type)
    if callable_match:
        return _map_callable(callable_match.group(1))

    # Unknown type - pass through as-is (could be a user-defined type)
    return py_type


def _split_type_args(args_str: str) -> list[str]:
    """Split comma-separated type arguments respecting bracket nesting."""
    result: list[str] = []
    depth = 0
    current = ""
    for ch in args_str:
        if ch in "([":
            depth += 1
            current += ch
        elif ch in ")]":
            depth -= 1
            current += ch
        elif ch == "," and depth == 0:
            result.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        result.append(current.strip())
    return result


def _map_callable(inner: str) -> str:
    """Map Callable[[A, B], R] inner part to TypeScript function type."""
    # Find the parameter list: [[A, B], R]
    # The inner string is like "[int, str], bool"
    bracket_match = re.match(r"^\[(.*)?\],\s*(.+)$", inner)
    if bracket_match:
        params_str = bracket_match.group(1) or ""
        return_type = bracket_match.group(2).strip()
        if params_str.strip():
            params = _split_type_args(params_str)
            param_parts = [f"arg{i}: {_map_type(p)}" for i, p in enumerate(params)]
            return f"({', '.join(param_parts)}) => {_map_type(return_type)}"
        else:
            return f"() => {_map_type(return_type)}"
    # Fallback
    return "(...args: any[]) => any"


def _emit_jsdoc(docstring: str | None, indent: str = "") -> str:
    """Emit a JSDoc comment from a docstring."""
    if not docstring:
        return ""
    lines = docstring.strip().split("\n")
    if len(lines) == 1:
        return f"{indent}/** {lines[0]} */\n"
    result = f"{indent}/**\n"
    for line in lines:
        result += f"{indent} * {line}\n"
    result += f"{indent} */\n"
    return result


def _emit_param(param: ParamInfo) -> str:
    """Emit a single TypeScript parameter."""
    ts_type = _map_type(param.type_hint)
    name = param.name

    # Handle *args and **kwargs
    if name.startswith("**"):
        return f"{name[2:]}: Record<string, {ts_type if param.type_hint else 'any'}>"
    if name.startswith("*"):
        return f"...{name[1:]}: {ts_type if param.type_hint else 'any'}[]"

    # Optional params (those with defaults)
    if param.default is not None:
        return f"{name}?: {ts_type}"

    return f"{name}: {ts_type}"


def _emit_function(func: FunctionInfo, indent: str = "") -> str:
    """Emit async + sync function declarations."""
    lines = ""

    params_str = ", ".join(_emit_param(p) for p in func.params)
    return_ts = _map_type(func.return_type)

    # Emit JSDoc
    lines += _emit_jsdoc(func.docstring, indent)

    # Async version (returns Promise<T>)
    lines += f"{indent}export function {func.name}({params_str}): Promise<{return_ts}>\n"

    # Sync version (returns T directly, suffixed with Sync)
    lines += f"{indent}export function {func.name}Sync({params_str}): {return_ts}\n"

    return lines


def _emit_method(func: FunctionInfo, indent: str = "  ") -> str:
    """Emit a method signature inside an interface."""
    lines = ""

    params_str = ", ".join(_emit_param(p) for p in func.params)
    return_ts = _map_type(func.return_type)

    lines += _emit_jsdoc(func.docstring, indent)
    lines += f"{indent}{func.name}({params_str}): Promise<{return_ts}>\n"
    lines += f"{indent}{func.name}Sync({params_str}): {return_ts}\n"

    return lines


def _emit_class(cls: ClassInfo) -> str:
    """Emit a TypeScript interface for a class."""
    lines = ""

    lines += _emit_jsdoc(cls.docstring)

    lines += f"export interface {cls.name} {{\n"

    # Emit fields (for dataclasses and TypedDicts)
    for fld in cls.fields:
        ts_type = _map_type(fld.type_hint)
        if fld.default is not None:
            lines += f"  {fld.name}?: {ts_type}\n"
        else:
            lines += f"  {fld.name}: {ts_type}\n"

    # Emit methods
    for method in cls.methods:
        lines += _emit_method(method)

    lines += "}\n"

    return lines


def emit_dts(module: ModuleInfo) -> str:
    """Generate TypeScript .d.ts content from module info."""
    parts: list[str] = []

    # Header
    parts.append("/**")
    parts.append(" * Auto-generated by node-api-python")
    parts.append(f" * Source: {module.name}.py")
    parts.append(" * Do not edit manually.")
    parts.append(" */")
    parts.append("")

    # Module docstring
    if module.docstring:
        parts.append(f"/** {module.docstring} */")
        parts.append("")

    # Classes first (interfaces)
    for cls in module.classes:
        parts.append(_emit_class(cls))

    # Functions
    for func in module.functions:
        parts.append(_emit_function(func))

    return "\n".join(parts)

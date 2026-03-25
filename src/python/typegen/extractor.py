"""Extract function signatures and type hints from Python source files using AST."""

import ast
from dataclasses import dataclass, field


@dataclass
class ParamInfo:
    name: str
    type_hint: str | None = None
    default: str | None = None  # "Hello", 42, None, etc.


@dataclass
class FunctionInfo:
    name: str
    params: list[ParamInfo] = field(default_factory=list)
    return_type: str | None = None
    docstring: str | None = None
    is_method: bool = False
    is_static: bool = False
    is_classmethod: bool = False


@dataclass
class FieldInfo:
    name: str
    type_hint: str
    default: str | None = None


@dataclass
class ClassInfo:
    name: str
    docstring: str | None = None
    methods: list[FunctionInfo] = field(default_factory=list)
    fields: list[FieldInfo] = field(default_factory=list)
    is_dataclass: bool = False
    is_typed_dict: bool = False
    bases: list[str] = field(default_factory=list)


@dataclass
class ModuleInfo:
    name: str
    functions: list[FunctionInfo] = field(default_factory=list)
    classes: list[ClassInfo] = field(default_factory=list)
    docstring: str | None = None


def _is_private(name: str) -> bool:
    """Check if a name is private (starts with underscore)."""
    return name.startswith("_")


def _unparse_annotation(node: ast.expr | None) -> str | None:
    """Convert an AST annotation node back to a string."""
    if node is None:
        return None
    return ast.unparse(node)


def _extract_default(node: ast.expr) -> str:
    """Extract a default value as a string representation."""
    return ast.unparse(node)


def _has_decorator(node: ast.ClassDef | ast.FunctionDef, name: str) -> bool:
    """Check if a node has a specific decorator."""
    for dec in node.decorator_list:
        if isinstance(dec, ast.Name) and dec.id == name:
            return True
        if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Name) and dec.func.id == name:
            return True
        if isinstance(dec, ast.Attribute) and dec.attr == name:
            return True
    return False


def _is_typed_dict(node: ast.ClassDef) -> bool:
    """Check if a class inherits from TypedDict."""
    for base in node.bases:
        if isinstance(base, ast.Name) and base.id == "TypedDict":
            return True
        if isinstance(base, ast.Attribute) and base.attr == "TypedDict":
            return True
    return False


def _extract_function(
    node: ast.FunctionDef | ast.AsyncFunctionDef, is_method: bool = False,
) -> FunctionInfo:
    """Extract function information from an AST node."""
    params: list[ParamInfo] = []

    args = node.args
    # Number of args without defaults
    num_args = len(args.args)
    num_defaults = len(args.defaults)
    default_offset = num_args - num_defaults

    for i, arg in enumerate(args.args):
        # Skip 'self' and 'cls' for methods
        if is_method and i == 0 and arg.arg in ("self", "cls"):
            continue

        type_hint = _unparse_annotation(arg.annotation)
        default = None
        default_idx = i - default_offset
        if default_idx >= 0:
            default = _extract_default(args.defaults[default_idx])

        params.append(ParamInfo(name=arg.arg, type_hint=type_hint, default=default))

    # Handle *args
    if args.vararg:
        type_hint = _unparse_annotation(args.vararg.annotation)
        params.append(ParamInfo(name=f"*{args.vararg.arg}", type_hint=type_hint))

    # Handle **kwargs
    if args.kwarg:
        type_hint = _unparse_annotation(args.kwarg.annotation)
        params.append(ParamInfo(name=f"**{args.kwarg.arg}", type_hint=type_hint))

    return_type = _unparse_annotation(node.returns)
    docstring = ast.get_docstring(node)

    is_static = _has_decorator(node, "staticmethod")
    is_classmethod = _has_decorator(node, "classmethod")

    return FunctionInfo(
        name=node.name,
        params=params,
        return_type=return_type,
        docstring=docstring,
        is_method=is_method,
        is_static=is_static,
        is_classmethod=is_classmethod,
    )


def _extract_fields(node: ast.ClassDef) -> list[FieldInfo]:
    """Extract annotated fields from a class body."""
    fields: list[FieldInfo] = []
    for item in node.body:
        if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
            name = item.target.id
            if _is_private(name):
                continue
            type_hint = _unparse_annotation(item.annotation) or "Any"
            default = None
            if item.value is not None:
                default = _extract_default(item.value)
            fields.append(FieldInfo(name=name, type_hint=type_hint, default=default))
    return fields


def _extract_class(node: ast.ClassDef) -> ClassInfo:
    """Extract class information from an AST node."""
    docstring = ast.get_docstring(node)
    is_dc = _has_decorator(node, "dataclass")
    is_td = _is_typed_dict(node)

    bases: list[str] = []
    for base in node.bases:
        bases.append(ast.unparse(base))

    methods: list[FunctionInfo] = []
    for item in node.body:
        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if _is_private(item.name):
                continue
            func_info = _extract_function(item, is_method=True)
            methods.append(func_info)

    fields = _extract_fields(node)

    return ClassInfo(
        name=node.name,
        docstring=docstring,
        methods=methods,
        fields=fields,
        is_dataclass=is_dc,
        is_typed_dict=is_td,
        bases=bases,
    )


def extract_module(source: str, module_name: str = "module") -> ModuleInfo:
    """Parse Python source code and extract type information."""
    tree = ast.parse(source)
    docstring = ast.get_docstring(tree)

    functions: list[FunctionInfo] = []
    classes: list[ClassInfo] = []

    for node in ast.iter_child_nodes(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if _is_private(node.name):
                continue
            functions.append(_extract_function(node))
        elif isinstance(node, ast.ClassDef):
            if _is_private(node.name):
                continue
            classes.append(_extract_class(node))

    return ModuleInfo(
        name=module_name,
        functions=functions,
        classes=classes,
        docstring=docstring,
    )

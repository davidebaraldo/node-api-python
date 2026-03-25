"""node-api-python type generator -- extracts Python type hints and emits TypeScript .d.ts files."""

from .emitter import emit_dts as emit_dts
from .extractor import ClassInfo as ClassInfo
from .extractor import FieldInfo as FieldInfo
from .extractor import FunctionInfo as FunctionInfo
from .extractor import ModuleInfo as ModuleInfo
from .extractor import ParamInfo as ParamInfo
from .extractor import extract_module as extract_module

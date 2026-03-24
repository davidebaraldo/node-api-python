#pragma once

#include <napi.h>
#include <pybind11/pybind11.h>

namespace py = pybind11;

namespace node_api_python {

// Convert a Python object to a JavaScript value.
Napi::Value PyToJs(Napi::Env env, py::handle obj);

// Convert a JavaScript value to a Python object.
py::object JsToPy(Napi::Value value);

// Extract a Python exception's message and traceback as a string.
std::string FormatPythonException();

} // namespace node_api_python

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

// Create a sync JS function wrapper for a Python callable.
Napi::Value MakeSyncCaller(Napi::Env env, py::object py_func);

// Create an async JS function wrapper (returns Promise) for a Python callable.
Napi::Value MakeAsyncCaller(Napi::Env env, py::object py_func);

// Build a JS proxy object for a Python object instance.
// Wraps callable attributes as name() (async) + nameSync() (sync).
Napi::Object BuildObjectProxy(Napi::Env env, py::handle obj);

} // namespace node_api_python

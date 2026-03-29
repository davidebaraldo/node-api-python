#pragma once

#include <napi.h>
#include <pybind11/pybind11.h>
#include <string>
#include <vector>

namespace py = pybind11;

namespace node_api_python {

// Convert a Python object to a JavaScript value.
Napi::Value PyToJs(Napi::Env env, py::handle obj);

// Convert a JavaScript value to a Python object.
py::object JsToPy(Napi::Value value);

// Extract a Python exception's message and traceback as a string.
std::string FormatPythonException();

// Structured Python traceback frame
struct PyTracebackFrame {
    std::string filename;
    int lineno;
    std::string funcname;
    std::string line;  // source line text (if available)
};

// Extract structured traceback + error info from current Python exception.
struct PyErrorInfo {
    std::string type;       // e.g. "ValueError"
    std::string message;    // e.g. "invalid input"
    std::vector<PyTracebackFrame> frames;
};

// Extract structured error info from the current Python exception.
// Must be called while the exception is still set (before PyErr_Clear).
PyErrorInfo ExtractPythonError(const py::error_already_set& e);

// Build a combined stack string: Python frames + a separator.
// Designed to be prepended to a JS Error's stack.
std::string FormatCombinedStack(const PyErrorInfo& info);

// Throw a JS Error with Python traceback attached as properties.
void ThrowPythonError(Napi::Env env, const py::error_already_set& e);

// Create a sync JS function wrapper for a Python callable.
Napi::Value MakeSyncCaller(Napi::Env env, py::object py_func);

// Create an async JS function wrapper (returns Promise) for a Python callable.
Napi::Value MakeAsyncCaller(Napi::Env env, py::object py_func);

// Build a JS proxy object for a Python object instance.
// Wraps callable attributes as name() (async) + nameSync() (sync).
Napi::Object BuildObjectProxy(Napi::Env env, py::handle obj);

} // namespace node_api_python

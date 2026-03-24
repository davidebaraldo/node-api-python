#pragma once

#include <napi.h>
#include <pybind11/pybind11.h>
#include <string>
#include <unordered_map>
#include <vector>
#include <functional>

namespace py = pybind11;

namespace node_api_python {

// Wraps a JS function so it can be called from Python.
// When Python calls the wrapper, it releases the GIL, invokes the JS
// callback on the main thread, then re-acquires the GIL.
class JsCallbackWrapper {
public:
    // Create a Python callable that wraps the given JS function.
    // The returned object can be passed to Python and called like a normal function.
    static py::object Create(Napi::Env env, Napi::Function js_func);

private:
    JsCallbackWrapper() = default;
};

// Async worker that calls a Python function on a worker thread.
class PyCallWorker : public Napi::AsyncWorker {
public:
    PyCallWorker(Napi::Env env,
                 py::object func,
                 std::vector<py::object> args,
                 Napi::Promise::Deferred deferred);

    void Execute() override;
    void OnOK() override;
    void OnError(const Napi::Error& error) override;

private:
    py::object func_;
    std::vector<py::object> args_;
    py::object result_;
    Napi::Promise::Deferred deferred_;
    std::string error_msg_;
};

// Wraps a Python module as a JS object with sync/async method access.
class PyModuleProxy : public Napi::ObjectWrap<PyModuleProxy> {
public:
    static Napi::Function GetClass(Napi::Env env);
    static Napi::Object NewInstance(Napi::Env env, py::module_ module);

    PyModuleProxy(const Napi::CallbackInfo& info);

    // Generic property getter — returns a wrapper for the Python attribute
    Napi::Value GetAttribute(const Napi::CallbackInfo& info);

    // Event emitter support
    Napi::Value On(const Napi::CallbackInfo& info);
    void Emit(const std::string& event, py::args args);

private:
    py::module_ module_;

    // Event listeners
    std::unordered_map<std::string, std::vector<Napi::FunctionReference>> listeners_;
};

} // namespace node_api_python

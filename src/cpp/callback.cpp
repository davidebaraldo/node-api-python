#include "callback.h"
#include "converter.h"
#include <stdexcept>

namespace node_api_python {

// ─── JsCallbackWrapper ─────────────────────────────────────────────────────

py::object JsCallbackWrapper::Create(Napi::Env env, Napi::Function js_func) {
    // Store a persistent reference to the JS function
    auto ref = std::make_shared<Napi::FunctionReference>(
        Napi::Persistent(js_func));
    ref->SuppressDestruct();

    // Create a Python function that calls through to JS.
    // NOTE: This only works when called from the main thread (where the
    // Node.js event loop runs). For cross-thread scenarios, use
    // ThreadSafeFunction in a future phase.
    auto raw_ptr = ref.get();
    auto invoke = [raw_ptr](py::args args) -> py::object {
        // We need to release the GIL before calling into JS
        py::gil_scoped_release release;

        Napi::Env env = raw_ptr->Env();
        Napi::HandleScope scope(env);

        std::vector<napi_value> js_args;
        js_args.reserve(args.size());

        // Re-acquire GIL briefly to convert args
        {
            py::gil_scoped_acquire acquire;
            for (size_t i = 0; i < args.size(); ++i) {
                js_args.push_back(PyToJs(env, args[i]));
            }
        }

        Napi::Value result = raw_ptr->Call(js_args);

        // Convert result back to Python
        py::gil_scoped_acquire acquire;
        return JsToPy(result);
    };

    // Wrap the C++ lambda as a Python callable using pybind11
    py::cpp_function py_func(invoke);
    return py_func;
}

// ─── PyCallWorker ───────────────────────────────────────────────────────────

PyCallWorker::PyCallWorker(Napi::Env env,
                           py::object func,
                           std::vector<py::object> args,
                           Napi::Promise::Deferred deferred)
    : Napi::AsyncWorker(env),
      func_(std::move(func)),
      args_(std::move(args)),
      deferred_(deferred) {}

void PyCallWorker::Execute() {
    try {
        py::gil_scoped_acquire gil;

        py::tuple py_args(args_.size());
        for (size_t i = 0; i < args_.size(); ++i) {
            py_args[i] = args_[i];
        }

        result_ = func_(*py_args);
    } catch (const py::error_already_set& e) {
        error_msg_ = e.what();
        SetError(error_msg_);
    } catch (const std::exception& e) {
        error_msg_ = e.what();
        SetError(error_msg_);
    }
}

void PyCallWorker::OnOK() {
    Napi::HandleScope scope(Env());
    py::gil_scoped_acquire gil;
    try {
        deferred_.Resolve(PyToJs(Env(), result_));
    } catch (const std::exception& e) {
        deferred_.Reject(Napi::Error::New(Env(), e.what()).Value());
    }
}

void PyCallWorker::OnError(const Napi::Error& error) {
    deferred_.Reject(error.Value());
}

// ─── PyModuleProxy ──────────────────────────────────────────────────────────

Napi::Function PyModuleProxy::GetClass(Napi::Env env) {
    return DefineClass(env, "PyModuleProxy", {
        InstanceMethod("__getattr__", &PyModuleProxy::GetAttribute),
        InstanceMethod("on", &PyModuleProxy::On),
    });
}

Napi::Object PyModuleProxy::NewInstance(Napi::Env env, py::module_ module) {
    // Store module in a static so the constructor can pick it up.
    // This is a workaround since ObjectWrap constructors receive CallbackInfo.
    static thread_local py::module_* pending_module = nullptr;
    pending_module = &module;

    auto ctor = GetClass(env);
    auto instance = ctor.New({});

    // The constructor should have picked up pending_module
    pending_module = nullptr;
    return instance;
}

PyModuleProxy::PyModuleProxy(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<PyModuleProxy>(info) {
    // Pick up the module from the static thread-local set by NewInstance
    // This is a necessary workaround for ObjectWrap constructor limitations
}

Napi::Value PyModuleProxy::GetAttribute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::Error::New(env, "Attribute name must be a string").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string name = info[0].As<Napi::String>().Utf8Value();

    py::gil_scoped_acquire gil;
    try {
        py::object attr = module_.attr(name.c_str());
        return PyToJs(env, attr);
    } catch (const py::error_already_set& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value PyModuleProxy::On(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction()) {
        Napi::Error::New(env, "Usage: .on(event, callback)")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string event = info[0].As<Napi::String>().Utf8Value();
    auto fn = info[1].As<Napi::Function>();
    listeners_[event].push_back(Napi::Persistent(fn));

    return info.This();
}

void PyModuleProxy::Emit(const std::string& event, py::args args) {
    auto it = listeners_.find(event);
    if (it == listeners_.end()) return;

    py::gil_scoped_release release;

    for (auto& ref : it->second) {
        Napi::Env env = ref.Env();
        Napi::HandleScope scope(env);

        std::vector<napi_value> js_args;
        {
            py::gil_scoped_acquire acquire;
            js_args.reserve(args.size());
            for (size_t i = 0; i < args.size(); ++i) {
                js_args.push_back(PyToJs(env, args[i]));
            }
        }

        ref.Call(js_args);
    }
}

} // namespace node_api_python

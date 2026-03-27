#include "callback.h"
#include "converter.h"
#include <stdexcept>
#include <mutex>
#include <condition_variable>
#include <thread>

namespace node_api_python {

// ─── JsCallbackWrapper ─────────────────────────────────────────────────────

// Data passed from the worker thread to the main thread via TSFN
struct CallbackBridge {
    std::vector<py::object> py_args;
    py::object result;
    std::string error;
    bool done = false;
    std::mutex mtx;
    std::condition_variable cv;
};

py::object JsCallbackWrapper::Create(Napi::Env env, Napi::Function js_func) {
    // Store a persistent reference to the JS function.
    auto ref = std::make_shared<Napi::FunctionReference>(
        Napi::Persistent(js_func));
    ref->SuppressDestruct();

    // Capture the main thread ID so we can detect cross-thread calls
    auto main_thread_id = std::this_thread::get_id();

    // Create a ThreadSafeFunction for cross-thread callback invocation.
    // The invoke callback runs on the main thread when called from a worker.
    auto tsfn = Napi::ThreadSafeFunction::New(
        env,
        js_func,
        "JsCallbackWrapper",
        0,    // unlimited queue
        1     // one thread (the invoke lambda captures the ref)
    );

    // prevent release-on-destroy so we control its lifetime via shared_ptr invoke captured ref
    auto tsfn_ptr = std::make_shared<Napi::ThreadSafeFunction>(std::move(tsfn));

    auto invoke = [ref, main_thread_id, tsfn_ptr](py::args args) -> py::object {
        if (std::this_thread::get_id() == main_thread_id) {
            // ── Main-thread fast path: call JS directly ──
            py::gil_scoped_release release;

            Napi::Env env = ref->Env();
            Napi::HandleScope scope(env);

            std::vector<napi_value> js_args;
            js_args.reserve(args.size());

            {
                py::gil_scoped_acquire acquire;
                for (size_t i = 0; i < args.size(); ++i) {
                    js_args.push_back(PyToJs(env, args[i]));
                }
            }

            Napi::Value result = ref->Call(js_args);

            py::gil_scoped_acquire acquire;
            return JsToPy(result);
        }

        // ── Worker-thread path: marshal call to main thread via TSFN ──
        auto bridge = std::make_shared<CallbackBridge>();
        {
            for (size_t i = 0; i < args.size(); ++i) {
                bridge->py_args.push_back(
                    py::reinterpret_borrow<py::object>(args[i]));
            }
        }

        // Release GIL before blocking — the main thread may need it
        // to convert args back to Python
        py::gil_scoped_release release;

        // Schedule callback on the main thread
        auto ref_copy = ref;
        auto bridge_copy = bridge;
        napi_status status = tsfn_ptr->BlockingCall(
            [ref_copy, bridge_copy](Napi::Env env, Napi::Function /*js_callback*/) {
                Napi::HandleScope scope(env);

                std::vector<napi_value> js_args;
                {
                    py::gil_scoped_acquire acquire;
                    js_args.reserve(bridge_copy->py_args.size());
                    for (auto& arg : bridge_copy->py_args) {
                        js_args.push_back(PyToJs(env, arg));
                    }
                }

                try {
                    Napi::Value result = ref_copy->Call(js_args);
                    {
                        py::gil_scoped_acquire acquire;
                        bridge_copy->result = JsToPy(result);
                    }
                } catch (const Napi::Error& e) {
                    bridge_copy->error = e.Message();
                } catch (const std::exception& e) {
                    bridge_copy->error = e.what();
                }

                {
                    std::lock_guard<std::mutex> lk(bridge_copy->mtx);
                    bridge_copy->done = true;
                }
                bridge_copy->cv.notify_one();
            });

        if (status != napi_ok) {
            py::gil_scoped_acquire acquire;
            throw std::runtime_error("Failed to schedule callback on main thread");
        }

        // Block until the main thread has executed the callback
        {
            std::unique_lock<std::mutex> lk(bridge->mtx);
            bridge->cv.wait(lk, [&] { return bridge->done; });
        }

        py::gil_scoped_acquire acquire;
        if (!bridge->error.empty()) {
            throw std::runtime_error(bridge->error);
        }
        return bridge->result;
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

PyCallWorker::~PyCallWorker() {
    // Acquire GIL to safely destroy Python objects (func_, args_, result_)
    py::gil_scoped_acquire gil;
    func_ = py::none();
    args_.clear();
    result_ = py::none();
}

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

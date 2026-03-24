/**
 * node-api-python — Native addon entry point
 *
 * Registers the N-API module and exposes the public JS API.
 * Python embedding logic lives in interpreter.cpp, converter.cpp,
 * and callback.cpp.
 */

#include <napi.h>
#include <pybind11/embed.h>
#include "interpreter.h"
#include "converter.h"
#include "callback.h"

namespace py = pybind11;
using namespace node_api_python;

// Helper: create a function wrapper (sync or async) for a Python callable
static Napi::Value MakeSyncCaller(Napi::Env env, py::object py_func) {
    // Store persistent reference to the Python function
    auto func_ptr = std::make_shared<py::object>(std::move(py_func));

    return Napi::Function::New(env, [func_ptr](const Napi::CallbackInfo& info) -> Napi::Value {
        Napi::Env env = info.Env();
        py::gil_scoped_acquire gil;

        try {
            py::tuple args(info.Length());
            for (size_t i = 0; i < info.Length(); ++i) {
                args[i] = JsToPy(info[i]);
            }

            py::object result = (*func_ptr)(*args);
            return PyToJs(env, result);
        } catch (const py::error_already_set& e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
            return env.Undefined();
        } catch (const std::exception& e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
            return env.Undefined();
        }
    });
}

static Napi::Value MakeAsyncCaller(Napi::Env env, py::object py_func) {
    auto func_ptr = std::make_shared<py::object>(std::move(py_func));

    return Napi::Function::New(env, [func_ptr](const Napi::CallbackInfo& info) -> Napi::Value {
        Napi::Env env = info.Env();
        auto deferred = Napi::Promise::Deferred::New(env);

        std::vector<py::object> args;
        args.reserve(info.Length());

        {
            py::gil_scoped_acquire gil;
            for (size_t i = 0; i < info.Length(); ++i) {
                args.push_back(JsToPy(info[i]));
            }
        }

        auto worker = new PyCallWorker(env, *func_ptr, std::move(args), deferred);
        worker->Queue();

        return deferred.Promise();
    });
}

// Build a JS proxy object for a Python module.
// Property access returns Python attributes. Callable attributes get
// both sync (nameSync) and async (name) wrappers.
static Napi::Object BuildModuleProxy(Napi::Env env, py::module_ mod) {
    py::gil_scoped_acquire gil;

    auto proxy = Napi::Object::New(env);

    // Get dir(module) to enumerate attributes
    py::list attrs = py::module_::import("builtins").attr("dir")(mod);

    for (auto& attr_name_handle : attrs) {
        std::string name = attr_name_handle.cast<std::string>();

        // Skip private/dunder attributes
        if (name.size() >= 1 && name[0] == '_') continue;

        py::object attr;
        try {
            attr = mod.attr(name.c_str());
        } catch (...) {
            continue;
        }

        if (py::isinstance<py::function>(attr) || py::hasattr(attr, "__call__")) {
            // Async version: mod.func(...) returns Promise
            proxy.Set(name, MakeAsyncCaller(env, attr));

            // Sync version: mod.funcSync(...) returns value directly
            proxy.Set(name + "Sync", MakeSyncCaller(env, attr));
        } else {
            // Non-callable: convert the value directly
            try {
                proxy.Set(name, PyToJs(env, attr));
            } catch (...) {
                // Skip attributes that can't be converted
            }
        }
    }

    // Also expose a generic __getattr__ for dynamic access
    auto mod_ptr = std::make_shared<py::module_>(mod);
    proxy.Set("__getattr__", Napi::Function::New(env,
        [mod_ptr](const Napi::CallbackInfo& info) -> Napi::Value {
            Napi::Env env = info.Env();
            if (info.Length() < 1 || !info[0].IsString()) {
                Napi::Error::New(env, "Attribute name required")
                    .ThrowAsJavaScriptException();
                return env.Undefined();
            }
            std::string name = info[0].As<Napi::String>().Utf8Value();
            py::gil_scoped_acquire gil;
            try {
                py::object attr = mod_ptr->attr(name.c_str());
                return PyToJs(env, attr);
            } catch (const py::error_already_set& e) {
                Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
                return env.Undefined();
            }
        }));

    return proxy;
}

// python.import(modulePath) — import a Python module and return a proxy
static Napi::Value ImportModule(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "python.import() requires a module name string")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string module_name = info[0].As<Napi::String>().Utf8Value();

    try {
        auto& interp = Interpreter::Instance();
        py::module_ mod = interp.ImportModule(module_name);
        return BuildModuleProxy(env, mod);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

// python.version — returns Python version string
static Napi::Value GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto& interp = Interpreter::Instance();
    if (!interp.IsInitialized()) {
        interp.Initialize();
    }
    return Napi::String::New(env, interp.PythonVersion());
}

// python.isInitialized — check if interpreter is running
static Napi::Value GetIsInitialized(const Napi::CallbackInfo& info) {
    return Napi::Boolean::New(info.Env(),
        Interpreter::Instance().IsInitialized());
}

// Cleanup on process exit
static void AtExit(void* /*arg*/) {
    Interpreter::Instance().Finalize();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Register the import function
    exports.Set("import", Napi::Function::New(env, ImportModule, "import"));

    // Register version getter
    exports.Set("version", Napi::Function::New(env, GetVersion, "version"));

    // Register isInitialized getter
    exports.Set("isInitialized",
        Napi::Function::New(env, GetIsInitialized, "isInitialized"));

    // Register cleanup hook
    napi_add_env_cleanup_hook(env, AtExit, nullptr);

    return exports;
}

NODE_API_MODULE(node_api_python, Init)

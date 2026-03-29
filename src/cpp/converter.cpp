#include "converter.h"
#include "callback.h"
#include <pybind11/eval.h>
#include <sstream>
#include <cmath>
#include <cstdint>

namespace node_api_python {

// Threshold beyond which Python int -> JS BigInt
static constexpr int64_t SAFE_INT_MAX = (1LL << 53);
static constexpr int64_t SAFE_INT_MIN = -(1LL << 53);

// ─── Python → JS ────────────────────────────────────────────────────────────

Napi::Value PyToJs(Napi::Env env, py::handle obj) {
    if (obj.is_none()) {
        return env.Null();
    }

    // Bool must be checked before int (Python bool is a subclass of int)
    if (py::isinstance<py::bool_>(obj)) {
        return Napi::Boolean::New(env, obj.cast<bool>());
    }

    if (py::isinstance<py::int_>(obj)) {
        // Check if value fits in safe integer range
        try {
            int64_t val = obj.cast<int64_t>();
            if (val >= SAFE_INT_MIN && val <= SAFE_INT_MAX) {
                return Napi::Number::New(env, static_cast<double>(val));
            }
            // Large int -> BigInt (fits in int64 but exceeds safe JS range)
            bool negative = val < 0;
            uint64_t abs_val = negative ? static_cast<uint64_t>(-val) : static_cast<uint64_t>(val);
            return Napi::BigInt::New(env, negative ? 1 : 0, 1, &abs_val);
        } catch (const py::cast_error&) {
            // Overflows int64 — extract sign and 64-bit words from Python int
            py::object pyint = py::reinterpret_borrow<py::object>(obj);
            int sign_bit = 0;
            if (pyint < py::int_(0)) {
                sign_bit = 1;
                pyint = -pyint;
            }

            int bit_len = pyint.attr("bit_length")().cast<int>();
            size_t word_count = static_cast<size_t>((bit_len + 63) / 64);
            if (word_count == 0) word_count = 1;

            std::vector<uint64_t> words(word_count);
            py::object mask = py::eval("(1 << 64) - 1");
            py::object shift = py::int_(64);
            for (size_t i = 0; i < word_count; ++i) {
                words[i] = (pyint & mask).cast<uint64_t>();
                pyint = pyint >> shift;
            }

            return Napi::BigInt::New(env, sign_bit, word_count, words.data());
        }
    }

    if (py::isinstance<py::float_>(obj)) {
        return Napi::Number::New(env, obj.cast<double>());
    }

    if (py::isinstance<py::str>(obj)) {
        return Napi::String::New(env, obj.cast<std::string>());
    }

    if (py::isinstance<py::bytes>(obj)) {
        std::string data = obj.cast<std::string>();
        auto buf = Napi::Buffer<char>::Copy(env, data.data(), data.size());
        return buf;
    }

    if (py::isinstance<py::bytearray>(obj)) {
        auto ba = obj.cast<py::bytearray>();
        const char* data = PyByteArray_AsString(ba.ptr());
        Py_ssize_t len = PyByteArray_Size(ba.ptr());
        return Napi::Buffer<char>::Copy(env, data, static_cast<size_t>(len));
    }

    // dict -> Object (must come before generic iterable checks)
    if (py::isinstance<py::dict>(obj)) {
        auto dict = obj.cast<py::dict>();
        auto js_obj = Napi::Object::New(env);
        for (auto& item : dict) {
            std::string key = py::str(item.first).cast<std::string>();
            js_obj.Set(key, PyToJs(env, item.second));
        }
        return js_obj;
    }

    // set/frozenset -> JS Set
    if (py::isinstance<py::set>(obj) || py::isinstance<py::frozenset>(obj)) {
        auto js_set_ctor = env.Global().Get("Set").As<Napi::Function>();
        auto js_set = js_set_ctor.New({});
        auto add_fn = js_set.Get("add").As<Napi::Function>();
        for (auto& item : obj) {
            add_fn.Call(js_set, { PyToJs(env, item) });
        }
        return js_set;
    }

    // tuple/list -> Array
    if (py::isinstance<py::tuple>(obj) || py::isinstance<py::list>(obj)) {
        auto seq = obj.cast<py::sequence>();
        size_t len = seq.size();
        auto arr = Napi::Array::New(env, len);
        for (size_t i = 0; i < len; ++i) {
            arr.Set(static_cast<uint32_t>(i), PyToJs(env, seq[i]));
        }
        return arr;
    }

    // datetime.datetime -> JS Date
    try {
        py::module_ dt_mod = py::module_::import("datetime");
        py::object datetime_type = dt_mod.attr("datetime");
        if (py::isinstance(obj, datetime_type)) {
            // Convert to timestamp (seconds since epoch) -> milliseconds
            double timestamp = obj.attr("timestamp")().cast<double>() * 1000.0;
            auto date_ctor = env.Global().Get("Date").As<Napi::Function>();
            return date_ctor.New({ Napi::Number::New(env, timestamp) });
        }
    } catch (...) {
        // datetime module not available or not a datetime; continue
    }

    // numpy.ndarray -> TypedArray (attempt zero-copy)
    try {
        py::module_ np = py::module_::import("numpy");
        py::object ndarray_type = np.attr("ndarray");
        if (py::isinstance(obj, ndarray_type)) {
            auto arr = py::reinterpret_borrow<py::object>(obj);

            // Ensure contiguous C-order array
            auto contiguous = np.attr("ascontiguousarray")(arr);
            std::string dtype = py::str(contiguous.attr("dtype")).cast<std::string>();
            size_t nbytes = contiguous.attr("nbytes").cast<size_t>();
            size_t count = contiguous.attr("size").cast<size_t>();

            // Get raw data pointer via buffer protocol
            py::buffer buf(contiguous);
            py::buffer_info info = buf.request();

            if (dtype == "float64") {
                auto ab = Napi::ArrayBuffer::New(env, nbytes);
                std::memcpy(ab.Data(), info.ptr, nbytes);
                return Napi::Float64Array::New(env, count, ab, 0);
            } else if (dtype == "float32") {
                auto ab = Napi::ArrayBuffer::New(env, nbytes);
                std::memcpy(ab.Data(), info.ptr, nbytes);
                return Napi::Float32Array::New(env, count, ab, 0);
            } else if (dtype == "int32") {
                auto ab = Napi::ArrayBuffer::New(env, nbytes);
                std::memcpy(ab.Data(), info.ptr, nbytes);
                return Napi::Int32Array::New(env, count, ab, 0);
            } else if (dtype == "uint8") {
                auto ab = Napi::ArrayBuffer::New(env, nbytes);
                std::memcpy(ab.Data(), info.ptr, nbytes);
                return Napi::Uint8Array::New(env, count, ab, 0);
            } else {
                // Fallback: convert to float64
                auto f64 = contiguous.attr("astype")("float64");
                py::buffer f64_buf(f64);
                py::buffer_info f64_info = f64_buf.request();
                auto ab = Napi::ArrayBuffer::New(env, count * sizeof(double));
                std::memcpy(ab.Data(), f64_info.ptr, count * sizeof(double));
                return Napi::Float64Array::New(env, count, ab, 0);
            }
        }
    } catch (const py::error_already_set&) {
        // numpy not available; continue
        PyErr_Clear();
    }

    // Python class instance with methods -> JS proxy object.
    // Skip modules and types to avoid deep/infinite recursion.
    try {
        if (py::hasattr(obj, "__dict__") &&
            !py::isinstance<py::module_>(obj) &&
            !PyType_Check(obj.ptr())) {
            return BuildObjectProxy(env, obj);
        }
    } catch (...) {}

    // Fallback: convert to string representation
    try {
        std::string repr = py::repr(obj).cast<std::string>();
        return Napi::String::New(env, repr);
    } catch (...) {
        return Napi::String::New(env, "[Python object]");
    }
}

// ─── JS → Python ────────────────────────────────────────────────────────────

py::object JsToPy(Napi::Value value) {
    Napi::Env env = value.Env();

    if (value.IsNull() || value.IsUndefined()) {
        return py::none();
    }

    if (value.IsBoolean()) {
        return py::bool_(value.As<Napi::Boolean>().Value());
    }

    if (value.IsBigInt()) {
        auto bigint = value.As<Napi::BigInt>();
        // Try to extract as int64 first
        bool lossless = false;
        int64_t val = bigint.Int64Value(&lossless);
        if (lossless) {
            return py::int_(val);
        }
        // Extract words for arbitrary precision
        size_t word_count = 0;
        int sign_bit = 0;
        bigint.ToWords(&sign_bit, &word_count, nullptr);

        std::vector<uint64_t> words(word_count);
        bigint.ToWords(&sign_bit, &word_count, words.data());

        // Build Python int from words (little-endian 64-bit words)
        py::object result = py::int_(0);
        py::object base = py::int_(1);
        py::object word_size = py::int_(1);
        // Compute 2^64
        word_size = py::eval("2**64");

        for (size_t i = 0; i < word_count; ++i) {
            result = result + base * py::int_(words[i]);
            base = base * word_size;
        }

        if (sign_bit) {
            result = -result;
        }
        return result;
    }

    if (value.IsNumber()) {
        double d = value.As<Napi::Number>().DoubleValue();
        // If the value is an exact integer, use Python int
        if (std::isfinite(d) && d == std::floor(d) &&
            std::abs(d) <= static_cast<double>(SAFE_INT_MAX)) {
            return py::int_(static_cast<int64_t>(d));
        }
        return py::float_(d);
    }

    if (value.IsString()) {
        return py::str(value.As<Napi::String>().Utf8Value());
    }

    if (value.IsBuffer()) {
        auto buf = value.As<Napi::Buffer<char>>();
        return py::bytes(buf.Data(), buf.Length());
    }

    if (value.IsArrayBuffer()) {
        auto ab = value.As<Napi::ArrayBuffer>();
        return py::bytes(static_cast<const char*>(ab.Data()), ab.ByteLength());
    }

    if (value.IsTypedArray()) {
        auto typed = value.As<Napi::TypedArray>();
        auto ab = typed.ArrayBuffer();
        size_t offset = typed.ByteOffset();
        size_t length = typed.ElementLength();

        // Try to create numpy array (zero-copy not possible across runtimes,
        // but we copy efficiently)
        try {
            py::module_ np = py::module_::import("numpy");
            napi_typedarray_type type = typed.TypedArrayType();
            const char* np_dtype = "float64";
            size_t elem_size = 8;

            switch (type) {
                case napi_float64_array: np_dtype = "float64"; elem_size = 8; break;
                case napi_float32_array: np_dtype = "float32"; elem_size = 4; break;
                case napi_int32_array:   np_dtype = "int32";   elem_size = 4; break;
                case napi_uint32_array:  np_dtype = "uint32";  elem_size = 4; break;
                case napi_int16_array:   np_dtype = "int16";   elem_size = 2; break;
                case napi_uint16_array:  np_dtype = "uint16";  elem_size = 2; break;
                case napi_int8_array:    np_dtype = "int8";    elem_size = 1; break;
                case napi_uint8_array:   np_dtype = "uint8";   elem_size = 1; break;
                default: break;
            }

            const char* data = static_cast<const char*>(ab.Data()) + offset;
            py::bytes raw(data, length * elem_size);
            auto arr = np.attr("frombuffer")(raw, np_dtype);
            return arr;
        } catch (const py::error_already_set&) {
            PyErr_Clear();
            // numpy not available, fall through to bytes
            const char* data = static_cast<const char*>(ab.Data()) + offset;
            return py::bytes(data, typed.ByteLength());
        }
    }

    // Function -> Python callable via JsCallbackWrapper
    if (value.IsFunction()) {
        return JsCallbackWrapper::Create(value.Env(), value.As<Napi::Function>());
    }

    // Date -> datetime
    if (value.IsObject()) {
        auto obj = value.As<Napi::Object>();
        // Check if it's a Date
        auto date_ctor = env.Global().Get("Date").As<Napi::Function>();
        if (obj.InstanceOf(date_ctor)) {
            double ms = obj.Get("getTime").As<Napi::Function>().Call(obj, {})
                .As<Napi::Number>().DoubleValue();
            py::module_ dt_mod = py::module_::import("datetime");
            return dt_mod.attr("datetime").attr("fromtimestamp")(ms / 1000.0);
        }

        // Check if it's a Set
        auto set_ctor = env.Global().Get("Set").As<Napi::Function>();
        if (obj.InstanceOf(set_ctor)) {
            py::set result;
            // Iterate using forEach
            auto entries = obj.Get("values").As<Napi::Function>().Call(obj, {}).As<Napi::Object>();
            auto next_fn = entries.Get("next").As<Napi::Function>();
            while (true) {
                auto iter_result = next_fn.Call(entries, {}).As<Napi::Object>();
                if (iter_result.Get("done").As<Napi::Boolean>().Value()) break;
                result.add(JsToPy(iter_result.Get("value")));
            }
            return result;
        }

        // Check if it's a Map
        auto map_ctor = env.Global().Get("Map").As<Napi::Function>();
        if (obj.InstanceOf(map_ctor)) {
            py::dict result;
            auto entries = obj.Get("entries").As<Napi::Function>().Call(obj, {}).As<Napi::Object>();
            auto next_fn = entries.Get("next").As<Napi::Function>();
            while (true) {
                auto iter_result = next_fn.Call(entries, {}).As<Napi::Object>();
                if (iter_result.Get("done").As<Napi::Boolean>().Value()) break;
                auto pair = iter_result.Get("value").As<Napi::Object>();
                auto key = pair.Get(static_cast<uint32_t>(0));
                auto val = pair.Get(static_cast<uint32_t>(1));
                result[JsToPy(key)] = JsToPy(val);
            }
            return result;
        }
    }

    // Array -> list
    if (value.IsArray()) {
        auto arr = value.As<Napi::Array>();
        py::list result(arr.Length());
        for (uint32_t i = 0; i < arr.Length(); ++i) {
            result[i] = JsToPy(arr.Get(i));
        }
        return result;
    }

    // Plain object -> dict
    if (value.IsObject()) {
        auto obj = value.As<Napi::Object>();
        auto names = obj.GetPropertyNames();
        py::dict result;
        for (uint32_t i = 0; i < names.Length(); ++i) {
            auto key = names.Get(i).As<Napi::String>().Utf8Value();
            result[py::str(key)] = JsToPy(obj.Get(key));
        }
        return result;
    }

    return py::none();
}

// ─── Error formatting ───────────────────────────────────────────────────────

std::string FormatPythonException() {
    try {
        py::module_ tb = py::module_::import("traceback");
        py::object format_exc = tb.attr("format_exc");
        std::string msg = format_exc().cast<std::string>();
        if (!msg.empty() && msg != "NoneType: None\n") {
            return msg;
        }
    } catch (...) {}

    // Fallback
    if (PyErr_Occurred()) {
        PyObject *type, *value, *traceback;
        PyErr_Fetch(&type, &value, &traceback);
        PyErr_NormalizeException(&type, &value, &traceback);
        if (value) {
            py::handle val_handle(value);
            try {
                return py::str(val_handle).cast<std::string>();
            } catch (...) {}
        }
        PyErr_Restore(type, value, traceback);
    }
    return "Unknown Python error";
}

PyErrorInfo ExtractPythonError(const py::error_already_set& e) {
    PyErrorInfo info;

    // Extract type name
    try {
        py::object type_obj = e.type();
        if (!type_obj.is_none()) {
            info.type = py::str(type_obj.attr("__name__")).cast<std::string>();
        }
    } catch (...) {
        info.type = "Exception";
    }

    // Extract message
    try {
        py::object value_obj = e.value();
        if (!value_obj.is_none()) {
            info.message = py::str(value_obj).cast<std::string>();
        }
    } catch (...) {
        info.message = "Unknown error";
    }

    // Extract traceback frames
    try {
        py::module_ tb_mod = py::module_::import("traceback");
        py::object value_obj = e.value();
        py::object tb_obj = value_obj.attr("__traceback__");

        if (!tb_obj.is_none()) {
            py::object extract = tb_mod.attr("extract_tb")(tb_obj);
            for (auto& frame_obj : extract) {
                PyTracebackFrame frame;
                frame.filename = py::str(frame_obj.attr("filename")).cast<std::string>();
                frame.lineno = frame_obj.attr("lineno").cast<int>();
                frame.funcname = py::str(frame_obj.attr("name")).cast<std::string>();
                try {
                    py::object line = frame_obj.attr("line");
                    if (!line.is_none()) {
                        frame.line = py::str(line).cast<std::string>();
                    }
                } catch (...) {}
                info.frames.push_back(std::move(frame));
            }
        }
    } catch (...) {
        // traceback extraction failed — info.frames stays empty
    }

    return info;
}

std::string FormatCombinedStack(const PyErrorInfo& info) {
    std::ostringstream ss;
    ss << info.type << ": " << info.message << "\n";

    // Python frames (innermost last, like Python convention)
    for (const auto& f : info.frames) {
        ss << "    at " << f.funcname << " (" << f.filename << ":" << f.lineno << ")";
        if (!f.line.empty()) {
            ss << " — " << f.line;
        }
        ss << "\n";
    }

    return ss.str();
}

void ThrowPythonError(Napi::Env env, const py::error_already_set& e) {
    PyErrorInfo info = ExtractPythonError(e);

    // Build error message: "ValueError: invalid input"
    std::string message = info.type + ": " + info.message;

    auto error = Napi::Error::New(env, message);
    auto obj = error.Value();

    // Attach structured info
    obj.Set("pythonType", Napi::String::New(env, info.type));
    obj.Set("pythonMessage", Napi::String::New(env, info.message));

    // Attach traceback as array of frame objects
    auto frames_arr = Napi::Array::New(env, info.frames.size());
    for (size_t i = 0; i < info.frames.size(); ++i) {
        auto frame_obj = Napi::Object::New(env);
        frame_obj.Set("file", Napi::String::New(env, info.frames[i].filename));
        frame_obj.Set("line", Napi::Number::New(env, info.frames[i].lineno));
        frame_obj.Set("function", Napi::String::New(env, info.frames[i].funcname));
        if (!info.frames[i].line.empty()) {
            frame_obj.Set("source", Napi::String::New(env, info.frames[i].line));
        }
        frames_arr.Set(static_cast<uint32_t>(i), frame_obj);
    }
    obj.Set("pythonTraceback", frames_arr);

    // Rewrite the stack property to include Python frames above JS frames
    try {
        auto existing_stack = obj.Get("stack").As<Napi::String>().Utf8Value();
        std::string combined = FormatCombinedStack(info) + "    --- Python/JS boundary ---\n" + existing_stack;
        obj.Set("stack", Napi::String::New(env, combined));
    } catch (...) {}

    error.ThrowAsJavaScriptException();
}

// ─── GIL-safe Python object pointers ─────────────────────────────────────────

// Custom deleter that acquires the GIL before destroying a py::object.
// Required because JS GC can destroy captured py::objects at any time,
// and Py_XDECREF is unsafe without the GIL.
static void GilSafeDelete(py::object* ptr) {
    py::gil_scoped_acquire gil;
    delete ptr;
}

static std::shared_ptr<py::object> MakeGilSafePtr(py::object obj) {
    return std::shared_ptr<py::object>(new py::object(std::move(obj)), GilSafeDelete);
}

// ─── Sync/Async callers ──────────────────────────────────────────────────────

Napi::Value MakeSyncCaller(Napi::Env env, py::object py_func) {
    auto func_ptr = MakeGilSafePtr(std::move(py_func));

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
            ThrowPythonError(env, e);
            return env.Undefined();
        } catch (const std::exception& e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
            return env.Undefined();
        }
    });
}

Napi::Value MakeAsyncCaller(Napi::Env env, py::object py_func) {
    auto func_ptr = MakeGilSafePtr(std::move(py_func));

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

// ─── Object proxy ────────────────────────────────────────────────────────────

Napi::Object BuildObjectProxy(Napi::Env env, py::handle obj) {
    auto proxy = Napi::Object::New(env);

    py::object callable_fn = py::module_::import("builtins").attr("callable");
    py::list attrs = py::module_::import("builtins").attr("dir")(obj);

    for (auto& attr_name_handle : attrs) {
        std::string name = attr_name_handle.cast<std::string>();

        // Skip private/dunder attributes
        if (!name.empty() && name[0] == '_') continue;

        py::object attr;
        try {
            attr = obj.attr(name.c_str());
        } catch (...) {
            continue;
        }

        bool is_callable = false;
        try {
            is_callable = callable_fn(attr).cast<bool>();
        } catch (...) {}

        if (is_callable) {
            proxy.Set(name, MakeAsyncCaller(env, attr));
            proxy.Set(name + "Sync", MakeSyncCaller(env, attr));
        } else {
            try {
                proxy.Set(name, PyToJs(env, attr));
            } catch (...) {
                // Skip unconvertible attributes
            }
        }
    }

    return proxy;
}

} // namespace node_api_python

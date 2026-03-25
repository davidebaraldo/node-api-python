#include "converter.h"
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
            // Large int -> BigInt
            bool negative = val < 0;
            uint64_t abs_val = negative ? static_cast<uint64_t>(-val) : static_cast<uint64_t>(val);
            return Napi::BigInt::New(env, negative ? -1 : 1,  1, &abs_val);
        } catch (const py::cast_error&) {
            // Overflows int64 — convert via string to BigInt
            std::string s = py::str(obj).cast<std::string>();
            // Remove leading +
            if (!s.empty() && s[0] == '+') s = s.substr(1);
            // Use N-API to create BigInt from string by converting through words
            // For simplicity, pass as string via eval-like approach
            // Actually, node-addon-api doesn't have BigInt from string directly.
            // We'll use Python to get the sign and digits.
            py::int_ pyint = obj.cast<py::int_>();
            int overflow = 0;
            long long test = PyLong_AsLongLongAndOverflow(pyint.ptr(), &overflow);
            (void)test;
            // For truly huge ints, convert to hex and parse
            std::string hex_str = py::module_::import("builtins")
                .attr("hex")(obj).cast<std::string>();
            // This is a limitation — for v0.1, return as string with a note
            return Napi::String::New(env, s);
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

} // namespace node_api_python

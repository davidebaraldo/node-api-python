#include "interpreter.h"
#include <cstdlib>
#include <filesystem>
#include <stdexcept>

#if defined(__linux__)
#include <dlfcn.h>
#endif

namespace fs = std::filesystem;

namespace node_api_python {

Interpreter& Interpreter::Instance() {
    static Interpreter instance;
    return instance;
}

Interpreter::~Interpreter() {
    if (initialized_) {
        Finalize();
    }
}

void Interpreter::Initialize() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (initialized_) return;

#if defined(__linux__)
    // Node.js loads .node addons with RTLD_LOCAL, hiding libpython symbols
    // from Python extension modules (e.g., math.so needs PyFloat_Type).
    // Re-open libpython with RTLD_GLOBAL so its symbols are globally visible.
    Dl_info dl_info;
    if (dladdr(reinterpret_cast<void*>(&Py_Initialize), &dl_info) && dl_info.dli_fname) {
        dlopen(dl_info.dli_fname, RTLD_NOW | RTLD_GLOBAL | RTLD_NOLOAD);
    }
#endif

    try {
        py::initialize_interpreter();
    } catch (const std::exception& e) {
        throw std::runtime_error(
            std::string("Failed to initialize Python interpreter: ") + e.what());
    }

    initialized_ = true;
    SetupVirtualEnv();

    // Add current working directory to sys.path
    AddToSysPath(".");

    // Release the GIL so worker threads (PyCallWorker) can acquire it.
    // All subsequent Python access uses py::gil_scoped_acquire.
    main_thread_state_ = PyEval_SaveThread();
}

void Interpreter::Finalize() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!initialized_) return;
    initialized_ = false;

    // Restore the main thread state so pybind11 shared_ptr destructors
    // can safely decrement Python refcounts during process exit.
    if (main_thread_state_) {
        PyEval_RestoreThread(main_thread_state_);
        main_thread_state_ = nullptr;
    }

    // Skip py::finalize_interpreter() — it crashes with active pybind11 refs.
    // The OS reclaims all resources on process exit.
}

bool Interpreter::IsInitialized() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return initialized_;
}

void Interpreter::EnsureInitialized() {
    if (!initialized_) {
        // Release lock before calling Initialize (which acquires it)
        Initialize();
    }
}

void Interpreter::SetupVirtualEnv() {
    const char* venv = std::getenv("VIRTUAL_ENV");
    if (!venv) return;

    fs::path venv_path(venv);

    // Add virtualenv site-packages to sys.path
#ifdef _WIN32
    fs::path site_packages = venv_path / "Lib" / "site-packages";
#else
    // Detect Python version for the site-packages path
    auto version = py::module_::import("sys").attr("version_info");
    int major = version.attr("major").cast<int>();
    int minor = version.attr("minor").cast<int>();
    std::string pydir = "python" + std::to_string(major) + "." + std::to_string(minor);
    fs::path site_packages = venv_path / "lib" / pydir / "site-packages";
#endif

    if (fs::exists(site_packages)) {
        AddToSysPath(site_packages.string());
    }
}

void Interpreter::AddToSysPath(const std::string& path) {
    // Caller must hold GIL (or be within initialized context)
    try {
        py::module_ sys = py::module_::import("sys");
        py::list sys_path = sys.attr("path").cast<py::list>();

        // Resolve to absolute path for reliable dedup
        std::string abs_path = fs::absolute(path).string();

        // Check if already present
        for (size_t i = 0; i < sys_path.size(); ++i) {
            if (sys_path[i].cast<std::string>() == abs_path) {
                return;
            }
        }
        sys_path.insert(0, abs_path);
    } catch (const py::error_already_set& e) {
        throw std::runtime_error(
            std::string("Failed to modify sys.path: ") + e.what());
    }
}

py::module_ Interpreter::ImportModule(const std::string& name) {
    EnsureInitialized();
    py::gil_scoped_acquire gil;

    std::string module_name = name;

    // Detect if the name is a file path (relative or absolute)
    bool is_path = false;

    // Relative: starts with ./ or .
    if (name.size() >= 2 && name[0] == '.' && (name[1] == '/' || name[1] == '\\')) {
        is_path = true;
    }
    // Absolute path
    if (!is_path) {
        fs::path p(name);
        if (p.is_absolute()) {
            is_path = true;
        }
    }

    if (is_path) {
        fs::path mod_path = fs::absolute(name);

        // If it points to a .py file, strip the extension
        if (mod_path.extension() == ".py") {
            module_name = mod_path.stem().string();
            AddToSysPath(mod_path.parent_path().string());
        } else if (fs::exists(mod_path.string() + ".py")) {
            module_name = mod_path.filename().string();
            AddToSysPath(mod_path.parent_path().string());
        } else if (fs::is_directory(mod_path)) {
            // Package directory: add parent and import directory name
            module_name = mod_path.filename().string();
            AddToSysPath(mod_path.parent_path().string());
        } else {
            // Treat the last component as the module name
            module_name = mod_path.filename().string();
            AddToSysPath(mod_path.parent_path().string());
        }
    }

    try {
        return py::module_::import(module_name.c_str());
    } catch (const py::error_already_set& e) {
        throw std::runtime_error(
            std::string("Failed to import module '") + name + "': " + e.what());
    }
}

std::string Interpreter::PythonVersion() const {
    if (!initialized_) return "not initialized";
    py::gil_scoped_acquire gil;
    return py::module_::import("sys").attr("version").cast<std::string>();
}

} // namespace node_api_python

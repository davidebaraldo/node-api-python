#include "interpreter.h"
#include <cstdlib>
#include <filesystem>
#include <stdexcept>

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
}

void Interpreter::Finalize() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!initialized_) return;

    try {
        py::finalize_interpreter();
    } catch (...) {
        // Swallow errors during shutdown
    }
    initialized_ = false;
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

    // Handle relative paths: "./foo/bar" -> add dir to sys.path, import "bar"
    if (name.size() >= 2 && (name[0] == '.' && (name[1] == '/' || name[1] == '\\'))) {
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

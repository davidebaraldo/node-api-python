#pragma once

#include <string>
#include <mutex>
#include <pybind11/embed.h>

namespace py = pybind11;

namespace node_api_python {

class Interpreter {
public:
    static Interpreter& Instance();

    void Initialize();
    void Finalize();
    bool IsInitialized() const;

    // Import a Python module by name or relative path.
    // Triggers lazy initialization if needed.
    py::module_ ImportModule(const std::string& name);

    // Add a directory to sys.path if not already present.
    void AddToSysPath(const std::string& path);

    std::string PythonVersion() const;

private:
    Interpreter() = default;
    ~Interpreter();
    Interpreter(const Interpreter&) = delete;
    Interpreter& operator=(const Interpreter&) = delete;

    void SetupVirtualEnv();
    void EnsureInitialized();

    bool initialized_ = false;
    mutable std::mutex mutex_;
    PyThreadState* main_thread_state_ = nullptr;
};

} // namespace node_api_python

# Contributing to node-api-python

Thanks for your interest! This guide will get you from zero to a working development environment in a few minutes.

---

## Quick Setup

### 1. Check prerequisites

| Tool | Minimum | Install |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| Python | 3.10+ | See [platform instructions below](#platform-specific-setup) |
| CMake | 3.15+ | See [platform instructions below](#platform-specific-setup) |
| C++ compiler | C++17 | See [platform instructions below](#platform-specific-setup) |

### 2. Clone and build

```bash
git clone https://github.com/davidebaraldo/node-api-python.git
cd node-api-python

# Run the doctor first — it tells you exactly what's missing
npm run doctor

# Install everything
npm install
pip install pybind11 numpy

# Build
npm run build

# Test
npm test
```

That's it. If `npm run doctor` passes, everything will work.

---

## Platform-Specific Setup

### Windows

```powershell
winget install Python.Python.3.13
winget install Kitware.CMake
pip install pybind11 numpy
```

For the C++ compiler, install **Visual Studio Build Tools**:
1. Download from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Select **"Desktop development with C++"**
3. Run commands from **Developer Command Prompt** or **Developer PowerShell**

### macOS

```bash
xcode-select --install          # C++ compiler
brew install python@3.13 cmake
pip3 install pybind11 numpy
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install python3 python3-dev python3-pip cmake build-essential
pip3 install pybind11 numpy
```

### Fedora / RHEL

```bash
sudo dnf install python3 python3-devel python3-pip cmake gcc-c++
pip3 install pybind11 numpy
```

---

## Project Structure

```
src/
├── cpp/              # C++ native addon (N-API + pybind11)
│   └── addon.cpp     # Entry point
├── python/
│   └── typegen/      # Type hint extractor + .d.ts emitter
lib/                  # TypeScript API layer
scripts/
├── cli.js            # CLI entry point (npx node-api-python ...)
├── doctor.js         # Environment diagnostic tool
├── find-python.js    # Python auto-detection
├── generate-types.js # Type generation CLI
└── postinstall.js    # Post-install checks
test/
├── js/               # Vitest tests
└── python/           # pytest tests
examples/             # Usage examples
```

---

## Development Commands

```bash
npm run build          # Build native addon + TypeScript
npm run build:native   # Build only native addon
npm run build:ts       # Build only TypeScript
npm run build:debug    # Build native addon with debug symbols

npm test               # Run all tests
npm run test:js        # Run only JS tests
npm run test:python    # Run only Python tests

npm run lint           # Lint JS + Python
npm run lint:fix       # Auto-fix lint issues

npm run doctor         # Check environment
npm run find-python    # Show detected Python
```

---

## How to Contribute

### Reporting Bugs

Open an issue with:
- Output of `npx node-api-python doctor`
- Minimal reproduction steps
- Expected vs actual behavior

### Suggesting Features

Open a [discussion](https://github.com/davidebaraldo/node-api-python/discussions) first. Describe the **use case**, not just the solution.

### Submitting Code

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests
4. Run `npm test` and `npm run lint`
5. Submit a PR

### Commit Messages

```
add zero-copy buffer support for TypedArray
fix GIL deadlock when calling async callbacks
update pybind11 to 2.13
```

Prefix with `fix`, `add`, `update`, `remove`, `refactor`, `docs`, or `test`.

### Code Style

- **C++**: Existing style, `clang-format` if available
- **TypeScript**: ESLint + Prettier
- **Python**: PEP 8, `ruff` for linting

---

## Questions?

Open a [discussion](https://github.com/davidebaraldo/node-api-python/discussions) or ask in an issue.

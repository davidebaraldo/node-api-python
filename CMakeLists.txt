cmake_minimum_required(VERSION 3.15)
project(node_api_python)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find Python
find_package(Python3 3.10...<3.15 REQUIRED COMPONENTS Interpreter Development)
message(STATUS "Python found: ${Python3_EXECUTABLE} (${Python3_VERSION})")
message(STATUS "Python include: ${Python3_INCLUDE_DIRS}")
message(STATUS "Python library: ${Python3_LIBRARIES}")

# Find pybind11
find_package(pybind11 CONFIG QUIET)
if(NOT pybind11_FOUND)
    # Fallback: fetch pybind11 from GitHub
    include(FetchContent)
    FetchContent_Declare(
        pybind11
        GIT_REPOSITORY https://github.com/pybind/pybind11.git
        GIT_TAG        v2.13.6
    )
    FetchContent_MakeAvailable(pybind11)
endif()

# Find node-addon-api
execute_process(
    COMMAND node -p "require('node-addon-api').include_dir"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)
message(STATUS "node-addon-api include: ${NODE_ADDON_API_DIR}")

# Find Node.js headers via cmake-js
include_directories(${CMAKE_JS_INC})
include_directories(${NODE_ADDON_API_DIR})

# Native addon source files
file(GLOB SOURCE_FILES "src/cpp/*.cpp")

add_library(${PROJECT_NAME} SHARED
    ${SOURCE_FILES}
    ${CMAKE_JS_SRC}
)

set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

target_link_libraries(${PROJECT_NAME}
    ${CMAKE_JS_LIB}
    Python3::Python
    pybind11::embed
)

# Ensure all libpython symbols are available to extension modules
# loaded at runtime (e.g., math.cpython-*.so needs PyFloat_Type)
if(UNIX AND NOT APPLE)
    # Linux: force all symbols from libpython to be exported
    target_link_options(${PROJECT_NAME} PRIVATE
        "LINKER:--no-as-needed"
        "LINKER:--export-dynamic"
    )
elseif(APPLE)
    # macOS: allow flat namespace lookups for Python extension modules
    target_link_options(${PROJECT_NAME} PRIVATE
        "LINKER:-undefined,dynamic_lookup"
        "LINKER:-flat_namespace"
    )
endif()

target_compile_definitions(${PROJECT_NAME} PRIVATE
    NAPI_VERSION=8
    NODE_ADDON_API_DISABLE_DEPRECATED
)

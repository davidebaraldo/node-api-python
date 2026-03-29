export interface ImportOptions {
  pythonPath?: string
  paths?: string[]
}

export interface PythonModule {
  [key: string]: any
}

export interface PythonTracebackFrame {
  file: string
  line: number
  function: string
  source?: string
}

export interface PythonError extends Error {
  pythonType: string
  pythonMessage: string
  pythonTraceback: PythonTracebackFrame[]
}

export type PyInt = number
export type PyFloat = number
export type PyStr = string
export type PyBool = boolean
export type PyNone = null
export type PyList<T = unknown> = T[]
export type PyDict<K extends string = string, V = unknown> = Record<K, V>
export type PyBytes = Buffer
export type PySet<T = unknown> = Set<T>
export type PyTuple<T extends unknown[] = unknown[]> = T

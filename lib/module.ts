import type { PythonModule } from './types'

export interface NativeAddon {
  callFunction(module: unknown, funcName: string, args: unknown[]): Promise<unknown>
  callFunctionSync(module: unknown, funcName: string, args: unknown[]): unknown
  getAttribute(module: unknown, attrName: string): unknown
}

type EventCallback = (...args: unknown[]) => void

export class PythonModuleProxy {
  private readonly _native: unknown
  private readonly _addon: NativeAddon
  private readonly _listeners: Map<string, EventCallback[]> = new Map()

  constructor(nativeModule: unknown, addon: NativeAddon) {
    this._native = nativeModule
    this._addon = addon
  }

  static create(nativeModule: unknown, addon: NativeAddon): PythonModule {
    const instance = new PythonModuleProxy(nativeModule, addon)
    return new Proxy(instance, {
      get(target, prop, receiver) {
        if (typeof prop === 'symbol') {
          if (prop === Symbol.asyncIterator) {
            return target._asyncIterator.bind(target)
          }
          return Reflect.get(target, prop, receiver)
        }

        if (prop === 'on') {
          return target._on.bind(target)
        }

        if (prop === 'then' || prop === 'toJSON' || prop === 'valueOf') {
          return undefined
        }

        const isSync = prop.endsWith('Sync')
        const attrName = isSync ? prop.slice(0, -4) : prop

        let attr: unknown
        try {
          attr = target._addon.getAttribute(target._native, attrName)
        } catch (err) {
          throw target._wrapError(err)
        }

        if (typeof attr === 'function' || target._isCallable(attr)) {
          if (isSync) {
            return (...args: unknown[]) => {
              try {
                return target._addon.callFunctionSync(target._native, attrName, args)
              } catch (err) {
                throw target._wrapError(err)
              }
            }
          }
          return (...args: unknown[]) => {
            return target._addon
              .callFunction(target._native, attrName, args)
              .catch((err: unknown) => {
                throw target._wrapError(err)
              })
          }
        }

        return attr
      },

      has(_target, prop) {
        return typeof prop === 'string'
      },
    }) as unknown as PythonModule
  }

  private _isCallable(attr: unknown): boolean {
    return (
      attr !== null &&
      typeof attr === 'object' &&
      '__callable__' in (attr as Record<string, unknown>)
    )
  }

  private _on(event: string, callback: EventCallback): void {
    let listeners = this._listeners.get(event)
    if (!listeners) {
      listeners = []
      this._listeners.set(event, listeners)
    }
    listeners.push(callback)
  }

  private async *_asyncIterator(): AsyncIterableIterator<unknown> {
    const iterator = await this._addon.callFunction(this._native, '__iter__', [])
    while (true) {
      try {
        const value = await this._addon.callFunction(
          this._native,
          '__next__',
          [iterator],
        )
        yield value
      } catch (err) {
        const wrapped = this._wrapError(err)
        if (wrapped.message.includes('StopIteration')) {
          return
        }
        throw wrapped
      }
    }
  }

  private _wrapError(err: unknown): Error {
    if (err instanceof Error) {
      const pyError = new Error(err.message)
      pyError.name = 'PythonError'
      if (err.stack) {
        pyError.stack = `PythonError: ${err.message}\n${err.stack}`
      }
      return pyError
    }
    return new Error(String(err))
  }
}

import { AnyFunction } from './types'

/**
 * Simple bind, faster than native
 * @param  {object} ctx 对应绑定的对象
 */
export function fasterBind<T extends AnyFunction>(fn: T, ctx: any): T {
  function boundFn(a: any) {
    const l = arguments.length
    return l ? (l > 1 ? fn.apply(ctx, arguments) : fn.call(ctx, a)) : fn.call(ctx)
  }
  // record original fn length
  boundFn._length = fn.length

  return boundFn as any
}

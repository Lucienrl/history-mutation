import { MutationAction, LoadType } from './invariant'

export type AnyFunction = (...args: any[]) => any

export interface HistoryMutationState {
  index: number
  previousPath: null | string
  currentPath: string
  // The history if is changed by a native operation, such as the native return key
  isNativeAction: boolean
  mutationAction: MutationAction
  loadType: LoadType
}

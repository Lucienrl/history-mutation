import { HistoryMutationState } from './types'
import { EventEmitter } from 'events'
import {
  MutationAction,
  LoadType,
  HistoryMethod,
  POP_STATE_EVENT,
  EventName,
  HISTORY_MUTATION_STATE_SYMBOL
} from './invariant'
import { fasterBind } from './utils'

const windowHistory = window.history
const windowLocation = window.location

export const getCurrentFullPath = () => windowLocation.pathname + windowLocation.search

export class HistoryMutation {
  eventEmitter = new EventEmitter()

  on = fasterBind(this.eventEmitter.on, this.eventEmitter)

  private nativeReplaceState = windowHistory.replaceState

  private isListenerTriggered = false

  private _state: HistoryMutationState = {
    index: 0,
    previousPath: null,
    currentPath: getCurrentFullPath(),
    isNativeAction: false,
    mutationAction: MutationAction.NONE,
    loadType: LoadType.FIRST_LOAD
  }

  get state() {
    return { ...this._state }
  }

  get index() {
    return this._state.index
  }

  get isFirst() {
    return this.index === 0
  }

  getNativeHistoryMutationState(): HistoryMutationState | undefined {
    return windowHistory.state?.[HISTORY_MUTATION_STATE_SYMBOL]
  }

  private syncBothState(state: HistoryMutationState = this._state) {
    const previousState = this.state

    this._state = state
    this.nativeReplaceState.apply(windowHistory, [
      { ...windowHistory.state, [HISTORY_MUTATION_STATE_SYMBOL]: state },
      ''
    ])
    this.eventEmitter.emit(EventName.CHANGE, state, previousState)
  }

  private rewriteHistoryCallee(
    calleeName: string,
    handler: (...args: any[]) => {
      mutationState?: Partial<HistoryMutationState>
      params: any[]
      needSyncNativeState?: boolean
    }
  ) {
    const historyCallee = windowHistory[calleeName]

    windowHistory[calleeName] = (...args: any[]) => {
      const { mutationState, params, needSyncNativeState } = handler(...args)

      const resp = historyCallee.apply(windowHistory, params)

      if (mutationState) {
        const { index: previousIndex } = this._state

        const nativeState = this.getNativeHistoryMutationState()!

        const finalState = {
          ...nativeState,
          ...mutationState,
          mutationAction:
            previousIndex > nativeState.index ? MutationAction.BACKWARD : MutationAction.FORWARD
        }

        if (needSyncNativeState) {
          this.syncBothState(finalState)
        } else {
          const previousState = this.state

          this._state = finalState
          this.eventEmitter.emit(EventName.CHANGE, finalState, previousState)
        }
      }

      return resp
    }
  }

  register() {
    const nativeHistoryMutationState = this.getNativeHistoryMutationState()

    if (nativeHistoryMutationState) {
      // 如果第二次执行，则为刷新
      this._state = { ...nativeHistoryMutationState, loadType: LoadType.RELOAD }
    }

    this.syncBothState()

    window.addEventListener(POP_STATE_EVENT, () => {
      // Note: call history.pushState() or history.replaceState(), it will not emit popstate event

      // Executes after the browser back button or Forward button is clicked to switch history, either forward or backward
      const isNativeAction = !this.isListenerTriggered

      this.isListenerTriggered = false

      const nativeState = this.getNativeHistoryMutationState()!

      const { index: currentIndex } = nativeState

      const { index: previousIndex } = this._state

      this.syncBothState({
        ...nativeState,
        mutationAction:
          previousIndex > currentIndex ? MutationAction.BACKWARD : MutationAction.FORWARD,
        isNativeAction
      })
    })

    this.rewriteHistoryCallee(HistoryMethod.GO, (delta) => {
      this.isListenerTriggered = true
      return { params: [delta] }
    })

    this.rewriteHistoryCallee(HistoryMethod.BACK, () => {
      this.isListenerTriggered = true
      return {
        params: []
      }
    })

    this.rewriteHistoryCallee(HistoryMethod.FORWARD, () => {
      this.isListenerTriggered = true
      return {
        params: []
      }
    })

    const getStateChanger =
      (method: string) => (data: any, unused: string, url?: string | URL | null) => {
        if (!url) {
          return {
            params: [
              { ...data, [HISTORY_MUTATION_STATE_SYMBOL]: this.getNativeHistoryMutationState() },
              unused
            ]
          }
        }

        const { index, currentPath, previousPath, ...rest } = this._state

        const nextState =
          method === HistoryMethod.PUSH_STATE
            ? {
                ...rest,
                index: index + 1,
                currentPath: url as string,
                previousPath: currentPath,
                loadType: LoadType.FIRST_LOAD,
                mutationAction: MutationAction.PUSH
              }
            : {
                ...rest,
                currentPath: url as string,
                previousPath: previousPath,
                loadType: LoadType.FIRST_LOAD,
                mutationAction: MutationAction.REPLACE
              }

        return {
          params: [{ ...data, [HISTORY_MUTATION_STATE_SYMBOL]: nextState }, unused, url],
          mutationState: nextState,
          needSyncNativeState: false
        }
      }

    this.rewriteHistoryCallee(HistoryMethod.PUSH_STATE, getStateChanger(HistoryMethod.PUSH_STATE))

    this.rewriteHistoryCallee(
      HistoryMethod.REPLACE_STATE,
      getStateChanger(HistoryMethod.REPLACE_STATE)
    )
  }
}

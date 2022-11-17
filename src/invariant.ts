export enum MutationAction {
  // by backward
  BACKWARD = 'backward',
  // by forward
  FORWARD = 'forward',
  // by push state
  PUSH = 'push',
  // by replace state
  REPLACE = 'replace',
  // initial，home page
  NONE = 'initial'
}

export const HISTORY_MUTATION_STATE_SYMBOL = 'HISTORY_MUTATION_STATE_SYMBOL'

export enum LoadType {
  // reload
  RELOAD = 'reload',
  // first load
  FIRST_LOAD = 'firstLoad'
}

export const POP_STATE_EVENT = 'popstate'

export enum HistoryMethod {
  GO = 'go',
  BACK = 'back',
  FORWARD = 'forward',
  PUSH_STATE = 'pushState',
  REPLACE_STATE = 'replaceState'
}

export enum EventName {
  CHANGE = 'change'
}

import types from './../constants/action_types'

export function setState(state) {
  return {
    type: types.SET_STATE,
    state
  }
}

export function logOut() {
  return {
    type: types.LOG_OUT
  }
}

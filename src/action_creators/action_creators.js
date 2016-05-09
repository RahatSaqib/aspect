import types from './../constants/action_types'

export function setState(state) {
  return {
    type: types.SET_STATE,
    state: state
  }
}

export function loginRequest() {
  return {
    type: types.LOGIN_REQUEST
  }
}

export function loginSuccess(name) {
  return {
    type: types.LOGIN_SUCCESS,
    name
  }
}

export function loginFailure(name) {
  return {
    type: types.LOGIN_FAILURE,
    name
  }
}

export function logOut() {
  return {
    type: types.LOG_OUT
  }
}

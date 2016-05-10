import { Map } from 'immutable'

import types from './../constants/action_types'

function loginRequest(state){
  return state.merge({ loggedIn: false, loggingIn: true })
}

function loginSuccess(state, name){
  return state.merge({ name: name, loggedIn: true, loggingIn: false })
}

function loginFailure(state){
  return state.merge({ name: '', loggedIn: false, loggingIn: false })
}

function logOut(state){
  return state.merge({ name: '', loggedIn: false, loggingIn: false })
}

const login = function(state = Map(), action) {
  switch (action.type) {
  case types.LOGIN_REQUEST:
    return loginRequest(state)
  case types.LOGIN_SUCCESS:
    return loginSuccess(state, action.name)
  case types.LOGIN_FAILURE:
    return loginFailure(state)
  case types.LOGOUT_SUCCESS:
    return logOut(state)
  }
  return state
}

export default login

import { Map } from 'immutable'

import types from './../constants/action_types'

function loginRequest(state){
  return state.merge({ loggedIn: false, loggingIn: true })
}

function loginSuccess(state, name, lang = 'en'){
  return state.merge({ name: name, lang: lang, loggedIn: true, loggingIn: false })
}

function loginFailure(state){
  return state.merge({ name: '', loggedIn: false, loggingIn: false })
}

function logOut(state){
  return state.merge({ name: '', loggedIn: false, loggingIn: false })
}

function changeLanguage(state, lang){
  return state.merge({ lang: lang })
}

const login = function(state = Map(), action) {
  switch (action.type) {
  case types.LOGIN_REQUEST:
    return loginRequest(state)
  case types.LOGIN_SUCCESS:
    return loginSuccess(state, action.name, action.lang)
  case types.LOGIN_FAILURE:
    return loginFailure(state)
  case types.LOGOUT_SUCCESS:
    return logOut(state)
  case types.CHANGE_LANGUAGE:
    return changeLanguage(state, action.lang)
  }
  return state
}

export default login

import Immutable from 'immutable'

import types from './../constants/action_types'

function loginRequest(state){
  return state.merge({ loggedIn: false, loggingIn: true })
}

function loginSuccess(state, name, culture, lang, drawerOpen){
  return state.merge({ name, culture, lang, loggedIn: true, loggingIn: false, drawerOpen })
}

function loginFailure(state){
  return state.merge({ name: '', loggedIn: false, loggingIn: false })
}

function logOut(state){
  return state.merge({ name: '', loggedIn: false, loggingIn: false })
}

function changeLanguage(state, lang){
  return state.merge({ lang })
}

function toggleDrawer(state, drawerOpen){
  return state.merge({ drawerOpen })
}

const login = function(state = Immutable.fromJS({ name: '', culture: 'en-US', lang: 'en', drawerOpen: true }), action) {
  switch (action.type) {
  case types.LOGIN_REQUEST:
    return loginRequest(state)
  case types.LOGIN_SUCCESS:
    return loginSuccess(state, action.name, action.culture, action.lang, action.drawerOpen)
  case types.LOGIN_FAILURE:
    return loginFailure(state)
  case types.LOGOUT_SUCCESS:
    return logOut(state)
  case types.CHANGE_LANGUAGE:
    return changeLanguage(state, action.lang)
  case types.TOGGLE_DRAWER:
    return toggleDrawer(state, action.drawerOpen)
  }
  return state
}

export default login

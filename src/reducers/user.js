import Immutable from 'immutable'

import types from './../constants/action_types'

function loginRequest(state){
  return state.merge({ loggedIn: false })
}

function loginSuccess(state, name, culture, lang, drawerOpen){
  return state.merge({ name, culture, lang, loggedIn: true,  drawerOpen })
}

function loginFailure(state){
  return state.merge({ name: '', loggedIn: false })
}

function logOut(state){
  return state.merge({ name: '', loggedIn: false })
}

function changeLanguage(state, lang, culture){
  return state.merge({ lang, culture })
}

function toggleDrawer(state, drawerOpen){
  return state.merge({ drawerOpen })
}

const User = Immutable.Record({
  name: '',
  culture: 'en-US',
  lang: 'en',
  drawerOpen: true,
  loggedIn: false
})

const initialState = new User()

function login(state = initialState, action) {
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
    return changeLanguage(state, action.lang, action.culture)
  case types.TOGGLE_DRAWER:
    return toggleDrawer(state, action.drawerOpen)
  }
  return state
}

export default login

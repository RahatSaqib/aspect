import { Map } from 'immutable'

import types from './../constants/action_types'

function setState(state, newState) {

  // doing this here because redux doesn't support being initialized
  // with an immutable.
  // if (!state || typeof(state.merge) !== 'function' || !state.merge){
  //   state = new Map()
  // }

  return state.merge(newState)
}

function logOut(state){

  let loggedOutUser = { name: '', loggedIn: false, loggingIn: false }

  return state.merge({ user: loggedOutUser })
}

export default function(state = Map(), action) {
  switch (action.type) {
  case types.SET_STATE:
    return setState(state, action.state)
  case types.LOGGING_IN:
    return setState(state, action.state)
  case types.LOGGED_IN:
    return setState(state, action.state)
  case types.LOG_OUT:
    return logOut(state, action.state)
  }
  return state
}

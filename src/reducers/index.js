import { combineReducers } from 'redux-immutable'

import types from './../constants/action_types'

// using our own routing reducer here because react-router-redux
// doesn't work with immutable out of the box
import routing from './routing'
import error from './error'
import user from './user'
import device from './device'
import person from './person'

const appReducer = combineReducers({
  routing,
  error,
  user,
  device,
  person
})

const rootReducer = (state, action) => {

  // on logout, empty state
  if (action.type === types.LOGOUT_SUCCESS) {
    state = undefined
  }

  return appReducer(state, action)
}

export default rootReducer

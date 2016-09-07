import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'

import types from './../constants/action_types'

import error from './error'
import user from './user'
import device from './device'
import person from './person'

const appReducer = combineReducers({
  form: formReducer,
  error,
  user,
  device,
  person
})

function rootReducer(state, action) {
  let nextState = state
  // on logout, empty state
  if (action.type === types.LOGOUT_SUCCESS) {
    nextState = undefined
  }

  return appReducer(nextState, action)
}

export default rootReducer

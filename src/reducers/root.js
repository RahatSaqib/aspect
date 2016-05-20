import { combineReducers } from 'redux-immutable'

import types from './../constants/action_types'
import error from './error'
import user from './user'
import device from './device'
import person from './person'

const appReducer = combineReducers({
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

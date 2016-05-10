import { combineReducers } from 'redux-immutable'

import types from './../constants/action_types'
import error from './error'
import user from './user'

const appReducer = combineReducers({
  error,
  user
})

const rootReducer = (state, action) => {

  // on logout, empty state
  if (action.type === types.LOGOUT_SUCCESS) {
    state = undefined
  }

  return appReducer(state, action)
}

export default rootReducer

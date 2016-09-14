import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'

import types from './../constants/action_types'

import error from './error'
import user from './user'
import device from './device'
import site from './site'
import person from './person'

const appReducer = combineReducers({
  form: formReducer,
  error,
  user,
  device,
  site,
  person
})

const App = Immutable.Record({
  form: undefined,
  error: undefined,
  user: undefined,
  device: undefined,
  site: undefined,
  person: undefined
})

const initialState = new App()

function rootReducer(state = initialState, action) {
  let nextState = state
  // on logout, empty state
  if (action.type === types.LOGOUT_SUCCESS) {
    nextState = initialState
  }

  return appReducer(nextState, action)
}

export default rootReducer

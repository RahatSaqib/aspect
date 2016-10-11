import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'

import error from './error/ErrorRedux'
import user, {
  types as authTypes
} from './auth/AuthRedux'
import device from './device/DeviceRedux'
import site from './site/SiteRedux'
import result from './result/ResultRedux'
import person from './person/PersonRedux'
import { reducer as idle } from './components/shared/idle/IdleRedux'

const appReducer = combineReducers({
  form: formReducer,
  error,
  user,
  device,
  site,
  result,
  person,
  idle
})

const App = Immutable.Record({
  form: undefined,
  error: undefined,
  user: undefined,
  device: undefined,
  site: undefined,
  result: undefined,
  person: undefined,
  idle: undefined
})

const initialState = new App()

export default function rootReducer(state = initialState, action) {
  let nextState = state
  // on logout, empty state
  if (action.type === authTypes.LOGOUT_SUCCESS) {
    nextState = initialState
  }

  return appReducer(nextState, action)
}

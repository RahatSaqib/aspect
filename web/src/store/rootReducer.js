import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'
import user, { types as authTypes } from './AuthRedux'
import jobs from './JobRedux'
import serviceDegradation from './ServiceDegradation'

const appReducer = combineReducers({
  user,
  form: formReducer,
  jobs,
  serviceDegradation,
})

const App = Immutable.Record({
  user: undefined,
  form: undefined,
  jobs: undefined,
  serviceDegradation: undefined,
})

const initialState = new App()

export default function rootReducer(state = initialState, action) {
  let nextState = state
  // on logout, empty state
  if (action.type === authTypes.LOGOUT) {
    nextState = initialState
  }

  return appReducer(nextState, action)
}

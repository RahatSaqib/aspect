import { combineReducers } from 'redux'
import user, { types as authTypes } from './AuthRedux'
import serviceDegradation from './ServiceDegradation'

const appReducer = combineReducers({
  user,
  serviceDegradation,
})

export default function rootReducer(state, action) {
  // on logout, empty state so every slice falls back to its initial state
  const nextState = action.type === authTypes.LOGOUT ? undefined : state

  return appReducer(nextState, action)
}

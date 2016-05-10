import { combineReducers } from 'redux-immutable'
import error from './error'
import user from './user'

const rootReducer = combineReducers({
  error,
  user
})

export default rootReducer

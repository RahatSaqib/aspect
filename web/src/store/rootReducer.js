import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'
import appNotification from './AppNotificationRedux'
import user, { types as authTypes } from './AuthRedux'
import device from './DeviceRedux'
import geography from './GeographyRedux'
import inventory from './InventoryRedux'
import jobs from './JobRedux'
import result from './ResultRedux'
import serviceDegradation from './ServiceDegradation'

const appReducer = combineReducers({
  appNotification,
  user,
  device,
  form: formReducer,
  geography,
  inventory,
  jobs,
  result,
  serviceDegradation,
})

const App = Immutable.Record({
  appNotification: undefined,
  user: undefined,
  device: undefined,
  form: undefined,
  geography: undefined,
  inventory: undefined,
  jobs: undefined,
  result: undefined,
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

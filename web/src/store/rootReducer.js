import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'
import appNotification from './AppNotificationRedux'
import user, { types as authTypes } from './AuthRedux'
import consumable from './ConsumableRedux'
import deviceOperation from './DeviceOperationRedux'
import device from './DeviceRedux'
import geography from './GeographyRedux'
import inventory from './InventoryRedux'
import jobs from './JobRedux'
import person from './PersonRedux'
import result from './ResultRedux'
import resultTreatmentStatus from './ResultTreatmentStatusRedux'

const appReducer = combineReducers({
  appNotification,
  user,
  consumable,
  deviceOperation,
  device,
  form: formReducer,
  geography,
  inventory,
  jobs,
  person,
  result,
  resultTreatmentStatus,
})

const App = Immutable.Record({
  appNotification: undefined,
  user: undefined,
  consumable: undefined,
  deviceOperation: undefined,
  device: undefined,
  form: undefined,
  geography: undefined,
  inventory: undefined,
  jobs: undefined,
  person: undefined,
  result: undefined,
  resultTreatmentStatus: undefined,
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

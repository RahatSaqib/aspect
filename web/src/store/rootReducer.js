import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'
import appNotification from './AppNotificationRedux'
import assay from './AssayRedux'
import user, { types as authTypes } from './AuthRedux'
import consumable from './ConsumableRedux'
import deviceOperation from './DeviceOperationRedux'
import device from './DeviceRedux'
import disease from './DiseaseRedux'
import geography from './GeographyRedux'
import globals from './GlobalsRedux'
import inventory from './InventoryRedux'
import jobs from './JobRedux'
import person from './PersonRedux'
import result from './ResultRedux'
import resultTreatmentStatus from './ResultTreatmentStatusRedux'
import site from './SiteRedux'
import task from './TaskRedux'

const appReducer = combineReducers({
  appNotification,
  assay,
  user,
  consumable,
  deviceOperation,
  device,
  disease,
  form: formReducer,
  geography,
  globals,
  inventory,
  jobs,
  person,
  result,
  resultTreatmentStatus,
  site,
  task,
})

const App = Immutable.Record({
  appNotification: undefined,
  assay: undefined,
  user: undefined,
  consumable: undefined,
  deviceOperation: undefined,
  device: undefined,
  disease: undefined,
  form: undefined,
  geography: undefined,
  globals: undefined,
  inventory: undefined,
  jobs: undefined,
  person: undefined,
  result: undefined,
  resultTreatmentStatus: undefined,
  site: undefined,
  task: undefined,
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

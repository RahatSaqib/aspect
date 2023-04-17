import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'
import appNotification from './AppNotificationRedux'
import assay from './AssayRedux'
import user, { types as authTypes } from './AuthRedux'
import consumable from './ConsumableRedux'
import deviceApiKey from './DeviceApiKeyRedux'
import deviceApproval from './DeviceApprovalRedux'
import deviceOperation from './DeviceOperationRedux'
import device from './DeviceRedux'
import deviceType from './DeviceTypeRedux'
import disease from './DiseaseRedux'
import geography from './GeographyRedux'
import globals from './GlobalsRedux'
import inventory from './InventoryRedux'
import jobs from './JobRedux'
import patient from './PatientRedux'
import person from './PersonRedux'
import resultCategoryGroup from './ResultCategoryGroupSelectFieldRedux'
import result from './ResultRedux'
import resultTreatmentStatus from './ResultTreatmentStatusRedux'
import resultWorkflowStatus from './ResultWorkflowStatusRedux'
import site from './SiteRedux'
import tag from './TagRedux'
import task from './TaskRedux'

const appReducer = combineReducers({
  appNotification,
  assay,
  consumable,
  device,
  deviceApiKey,
  deviceApproval,
  deviceOperation,
  deviceType,
  disease,
  form: formReducer,
  geography,
  globals,
  inventory,
  jobs,
  patient,
  person,
  resultCategoryGroup,
  result,
  resultTreatmentStatus,
  resultWorkflowStatus,
  site,
  tag,
  task,
  user,
})

const App = Immutable.Record({
  // accountDetails: undefined,
  appNotification: undefined,
  assay: undefined,
  consumable: undefined,
  device: undefined,
  deviceApiKey: undefined,
  deviceApproval: undefined,
  deviceOperation: undefined,
  deviceType: undefined,
  disease: undefined,
  form: undefined,
  geography: undefined,
  globals: undefined,
  inventory: undefined,
  jobs: undefined,
  patient: undefined,
  person: undefined,
  result: undefined,
  resultTreatmentStatus: undefined,
  resultWorkflowStatus: undefined,
  site: undefined,
  tag: undefined,
  task: undefined,
  user: undefined,
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

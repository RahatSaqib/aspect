import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'
import accountDetails from './AccountRedux'
import appNotification from './AppNotificationRedux'
import assay from './AssayRedux'
import assayType from './AssayTypeRedux'
import user, { types as authTypes } from './AuthRedux'
import _case from './CaseRedux'
import consumable from './ConsumableRedux'
import deviceApiKey from './DeviceApiKeyRedux'
import deviceApproval from './DeviceApprovalRedux'
import deviceMaintenanceStatus from './DeviceMaintenanceStatusRedux'
import deviceOperation from './DeviceOperationRedux'
import device from './DeviceRedux'
import deviceType from './DeviceTypeRedux'
import disease from './DiseaseRedux'
import filter from './FilterRedux'
import geography from './GeographyRedux'
import globals from './GlobalsRedux'
import idle from './IdleRedux'
import inventory from './InventoryRedux'
import jobs from './JobRedux'
import patient from './PatientRedux'
import person from './PersonRedux'
import report from './ReportRedux'
import resultCategoryGroup from './ResultCategoryGroupSelectFieldRedux'
import result from './ResultRedux'
import resultTreatmentStatus from './ResultTreatmentStatusRedux'
import resultWorkflowStatus from './ResultWorkflowStatusRedux'
import router from './RouterRedux'
import site from './SiteRedux'
import tag from './TagRedux'
import task from './TaskRedux'

const appReducer = combineReducers({
  accountDetails,
  appNotification,
  assay,
  assayType,
  case: _case,
  consumable,
  device,
  deviceApiKey,
  deviceApproval,
  deviceMaintenanceStatus,
  resultCategoryGroup,
  deviceOperation,
  deviceType,
  disease,
  filter,
  form: formReducer,
  geography,
  globals,
  idle,
  inventory,
  jobs,
  patient,
  person,
  report,
  result,
  resultTreatmentStatus,
  resultWorkflowStatus,
  router,
  site,
  tag,
  task,
  user,
})

const App = Immutable.Record({
  accountDetails: undefined,
  appNotification: undefined,
  assay: undefined,
  assayType: undefined,
  case: undefined,
  consumable: undefined,
  device: undefined,
  deviceApiKey: undefined,
  deviceOperation: undefined,
  deviceApproval: undefined,
  deviceType: undefined,
  disease: undefined,
  filter: undefined,
  form: undefined,
  geography: undefined,
  globals: undefined,
  idle: undefined,
  inventory: undefined,
  jobs: undefined,
  patient: undefined,
  person: undefined,
  report: undefined,
  result: undefined,
  resultTreatmentStatus: undefined,
  resultWorkflowStatus: undefined,
  router: undefined,
  site: undefined,
  tag: undefined,
  task: undefined,
  user: undefined,
  deviceMaintenanceStatus: undefined,
  resultCategoryGroup: undefined,
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

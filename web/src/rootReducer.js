import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'

import globals from './globals/GlobalsRedux'
import appNotification from './appNotification/AppNotificationRedux'
import filter from './filter/FilterRedux'
import user, { types as authTypes } from './auth/AuthRedux'
import dashboard from './dashboard/DashboardRedux'
import demo from './demo/DemoRedux'
import device from './device/DeviceRedux'
import deviceApiKey from './deviceApiKey/DeviceApiKeyRedux'
import deviceOperation from './deviceOperation/DeviceOperationRedux'
import deviceApproval from './deviceApproval/DeviceApprovalRedux'
import deviceType from './deviceType/DeviceTypeRedux'
import disease from './disease/DiseaseRedux'
import site from './site/SiteRedux'
import result from './result/ResultRedux'
import person from './person/PersonRedux'
import accountDetails from './account/AccountRedux'
import geography from './geography/GeographyRedux'
import assay from './assay/AssayRedux'
import assayType from './assay/AssayTypeRedux'
import consumable from './consumable/ConsumableRedux'
import inventory from './inventory/InventoryRedux'
import notification from './notification/NotificationRedux'
import tag from './tag/TagRedux'
import task from './task/TaskRedux'
import idle from './idle/IdleRedux'
import jobs from './job/JobRedux'
import router from './router/RouterRedux'
import resultWorkflowStatus from './resultWorkflowStatus/ResultWorkflowStatusRedux'
import resultTreatmentStatus from './resultTreatmentStatus/ResultTreatmentStatusRedux'
import report from './report/ReportRedux'
import reporter from './reporter/ReporterRedux'
import patient from './patient/PatientRedux'
import clinicalIndicators from './MigratedComponents/Graphs/GraphRender/Redux'
import resultsDetail from './MigratedComponents/Results/Detail/Redux/resultsDetail'
import resultsForm from './MigratedComponents/Results/Detail/Redux/resultsForm'
import _case from './case/CaseRedux'

const appReducer = combineReducers({
  accountDetails,
  appNotification,
  assay,
  assayType,
  case: _case,
  clinicalIndicators,
  consumable,
  dashboard,
  demo,
  device,
  deviceApiKey,
  deviceOperation,
  deviceApproval,
  deviceType,
  disease,
  filter,
  form: formReducer,
  geography,
  globals,
  idle,
  inventory,
  jobs,
  notification,
  patient,
  person,
  report,
  reporter,
  result,
  resultsDetail,
  resultsForm,
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
  clinicalIndicators: undefined,
  consumable: undefined,
  dashboard: undefined,
  demo: undefined,
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
  notification: undefined,
  patient: undefined,
  person: undefined,
  report: undefined,
  reporter: undefined,
  result: undefined,
  resultsDetail: undefined,
  resultsForm: undefined,
  resultTreatmentStatus: undefined,
  resultWorkflowStatus: undefined,
  router: undefined,
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

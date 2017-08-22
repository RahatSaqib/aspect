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
import deviceStatus from './deviceStatus/DeviceStatusRedux'
import site from './site/SiteRedux'
import result from './result/ResultRedux'
import person from './person/PersonRedux'
import accountDetails from './account/AccountRedux'
import geography from './geography/GeographyRedux'
import assay from './assay/AssayRedux'
import consumable from './consumable/ConsumableRedux'
import inventory from './inventory/InventoryRedux'
import notification from './notification/NotificationRedux'
import task from './task/TaskRedux'
import report from './report/ReportRedux'
import idle from './idle/IdleRedux'
import jobs from './job/JobRedux'
import router from './router/RouterRedux'
import resultWorkflowStatus from './resultWorkflowStatus/ResultWorkflowStatusRedux'
import reporter from './reporter/ReporterRedux'

const appReducer = combineReducers({
  form: formReducer,
  globals,
  appNotification,
  filter,
  user,
  dashboard,
  demo,
  device,
  deviceApiKey,
  deviceStatus,
  site,
  person,
  accountDetails,
  result,
  geography,
  assay,
  jobs,
  consumable,
  inventory,
  idle,
  notification,
  task,
  report,
  router,
  resultWorkflowStatus,
  reporter,
})

const App = Immutable.Record({
  form: undefined,
  globals: undefined,
  appNotification: undefined,
  filter: undefined,
  user: undefined,
  dashboard: undefined,
  demo: undefined,
  device: undefined,
  deviceApiKey: undefined,
  deviceStatus: undefined,
  site: undefined,
  person: undefined,
  accountDetails: undefined,
  geography: undefined,
  assay: undefined,
  notification: undefined,
  task: undefined,
  report: undefined,
  result: undefined,
  jobs: undefined,
  consumable: undefined,
  inventory: undefined,
  idle: undefined,
  router: undefined,
  resultWorkflowStatus: undefined,
  reporter: undefined,
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

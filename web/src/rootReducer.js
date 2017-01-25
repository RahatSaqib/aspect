import Immutable from 'immutable'
import { reducer as formReducer } from 'redux-form/immutable'
import { combineReducers } from 'redux-immutable'

import appNotification from './appNotification/AppNotificationRedux'
import filter from './filter/FilterRedux'
import user, {
  types as authTypes
} from './auth/AuthRedux'
import dashboard from './dashboard/DashboardRedux'
import demo from './demo/DemoRedux'
import device from './device/DeviceRedux'
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
import report from './report/ReportRedux'
import idle from './idle/IdleRedux'
import roles from './role/RoleRedux'
import router from './router/RouterRedux'
import resultWorkflowStatus from './resultWorkflowStatus/ResultWorkflowStatusRedux'
import terminal from './terminal/TerminalRedux'

const appReducer = combineReducers({
  form: formReducer,
  appNotification,
  filter,
  user,
  dashboard,
  demo,
  device,
  deviceStatus,
  site,
  person,
  accountDetails,
  result,
  geography,
  assay,
  roles,
  consumable,
  inventory,
  idle,
  notification,
  report,
  router,
  resultWorkflowStatus,
  terminal
})

const App = Immutable.Record({
  form: undefined,
  appNotification: undefined,
  filter: undefined,
  user: undefined,
  dashboard: undefined,
  demo: undefined,
  device: undefined,
  deviceStatus: undefined,
  site: undefined,
  person: undefined,
  accountDetails: undefined,
  geography: undefined,
  assay: undefined,
  notification: undefined,
  report: undefined,
  result: undefined,
  roles: undefined,
  consumable: undefined,
  inventory: undefined,
  idle: undefined,
  router: undefined,
  resultWorkflowStatus: undefined,
  terminal: undefined
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

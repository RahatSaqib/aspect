import _ from 'lodash'
import React from 'react'
import { Router, Switch, Route, Redirect } from 'react-router-dom'
import Paper from 'material-ui/Paper'
import { compose } from 'recompose'

import history from '../../history'
import signedOutFactory from './signedOutFactory'
import loggedInFactory from './loggedInFactory'
import loggedInDetailFactory from './loggedInFactory/detailFactory'
import { isEnabledFeature } from '../../components/shared/requirePermissions'

// "Pages"
import LoadableLogin from '../../auth/login/LoadableLogin'
import ResetPassword from '../../auth/resetPassword/ResetPassword'
import LoadableStatus from '../../dashboard/status/LoadableStatus'
import TaskList from '../../task/list/TaskList'
import TaskAggre from '../../task/aggre/TaskAggre'
import TaskDetail from '../../task/detail/TaskDetail'
import OperationalData from '../../dashboard/operational/OperationalData'
import DeviceDemo from '../../demo/device/DeviceDemo'
import DeviceList from '../../device/list/DeviceList'
import DeviceDetail from '../../device/detail/DeviceDetail'
import DeviceApiKeyList from '../../deviceApiKey/list/DeviceApiKeyList'
import SiteList from '../../site/list/SiteList'
import SiteDetail from '../../site/detail/SiteDetail'
import PersonList from '../../person/list/PersonList'
import PersonDetail from '../../person/detail/PersonDetail'
import ResultList from '../../result/list/ResultList'
import ResultDetail from '../../result/detail/ResultDetail'
import NotificationList from '../../notification/list/NotificationList'
import NotificationDetail from '../../notification/detail/NotificationDetail'
import ReportList from '../../report/list/ReportList'
import AccountDetails from '../../account/detail/AccountDetails'
import StyleguideMain from '../../styleguide/main/StyleguideMain'
import InventoryItemsList from '../../inventory/list/InventoryItemsList'
import RouterList from '../../router/list/RouterList'
import RouterDetail from '../../router/detail/RouterDetail'
import ReporterList from '../../reporter/list/ReporterList'
import ReporterDetail from '../../reporter/detail/ReporterDetail'
import NotFound from '../../error/notFound/NotFound'

const notImplementedLoggedInFactory = compose(loggedInFactory, name => () => (
  <div style={{ padding: 10 }}>
    <Paper style={{ padding: 10 }}>{name} is not implemented yet</Paper>
  </div>
))

const makeRenderRedirectToLoginWithReason = _.memoize(
  reason => ({ location }) => (
    <Redirect
      to={{
        pathname: '/login',
        state: { referrer: location, reason },
      }}
    />
  )
)

const renderRedirectToLoginOr = props =>
  props.isLoggedOut &&
  makeRenderRedirectToLoginWithReason(props.loggedOutReason)

const renderRedirectToDashboard = ({ location }) => (
  <Redirect
    to={{
      pathname: '/dashboard',
      state: { referrer: location },
    }}
  />
)

const renderRedirectToNotFound = (props, requiredFeature) => {
  const t = !isEnabledFeature(props.features, requiredFeature)
  if (t) return renderNotFound
}

const renderLoadableLogin = signedOutFactory(LoadableLogin)
const renderResetPassword = signedOutFactory(ResetPassword)
const renderLoadableStatus = loggedInFactory(LoadableStatus)
const renderTaskList = loggedInFactory(TaskList)
const renderTaskAggre = loggedInDetailFactory(TaskAggre)
const renderTaskDetail = loggedInDetailFactory(TaskDetail)
const renderOperationalData = loggedInFactory(OperationalData)
const renderAccountDetails = loggedInFactory(AccountDetails)
const renderDeviceDemo = loggedInFactory(DeviceDemo)
/* TODO: real components */
const renderClinicalIndicators = notImplementedLoggedInFactory(
  'Clinical Indicators'
)
const renderReports = notImplementedLoggedInFactory('Reports')
const renderManage = notImplementedLoggedInFactory('Manage')
/* END-TODO: real components */
const renderDeviceList = loggedInFactory(DeviceList)
const renderDeviceDetail = loggedInDetailFactory(DeviceDetail)
const renderDeviceApiKeyList = loggedInFactory(DeviceApiKeyList)
const renderRouterList = loggedInFactory(RouterList)
const renderRouterDetail = loggedInFactory(RouterDetail)
const renderReporterList = loggedInFactory(ReporterList)
const renderReporterDetail = loggedInFactory(ReporterDetail)
const renderResultList = loggedInFactory(ResultList)
const renderResultDetail = loggedInFactory(ResultDetail)
const renderSiteList = loggedInFactory(SiteList)
const renderSiteDetail = loggedInFactory(SiteDetail)
const renderPersonList = loggedInFactory(PersonList)
const renderPersonDetail = loggedInFactory(PersonDetail)
const renderInventoryItemsList = loggedInFactory(InventoryItemsList)
const renderNotificationList = loggedInFactory(NotificationList)
const renderNotificationDetail = loggedInDetailFactory(NotificationDetail)
const renderReportList = loggedInFactory(ReportList)
const renderNotFound = signedOutFactory(NotFound)

export const routerFactory = () => props => (
  <Router history={history}>
    <Switch>
      <Route
        exact
        path="/"
        render={renderRedirectToLoginOr(props) || renderRedirectToDashboard}
      />

      <Route path="/login" render={renderLoadableLogin} />
      <Route path="/reset-password" render={renderResetPassword} />

      <Route
        exact
        path="/dashboard"
        render={renderRedirectToLoginOr(props) || renderLoadableStatus}
      />
      <Route
        exact
        path="/task-list"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['task']) ||
          renderTaskList
        }
      />
      <Route
        exact
        path="/task-list/aggre-list"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['task']) ||
          renderTaskAggre
        }
      />
      <Route
        path="/task-list/:taskId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['task']) ||
          renderTaskDetail
        }
      />
      <Route
        path="/operational-data"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['operationalData']) ||
          renderOperationalData
        }
      />

      <Route
        path="/account-details/current"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['account']) ||
          renderAccountDetails
        }
      />

      <Route
        path="/demo/device/:deviceId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['deviceDemo']) ||
          renderDeviceDemo
        }
      />

      <Route
        path="/clinical-indicators"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['clinicalIndicators']) ||
          renderClinicalIndicators
        }
      />
      <Route
        path="/reports"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['reports']) ||
          renderReports
        }
      />
      <Route
        path="/manage"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['manage']) ||
          renderManage
        }
      />

      <Redirect exact path="/browse" to="/browse/device" />

      <Route
        exact
        path="/browse/device"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['device']) ||
          renderDeviceList
        }
      />
      <Route
        path="/browse/device/:deviceId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['device']) ||
          renderDeviceDetail
        }
      />

      <Route
        exact
        path="/browse/deviceApiKey"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['deviceApiKey']) ||
          renderDeviceApiKeyList
        }
      />

      <Route
        exact
        path="/browse/router"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['router']) ||
          renderRouterList
        }
      />
      <Route
        path="/browse/router/:routerId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['router']) ||
          renderRouterDetail
        }
      />

      <Route
        exact
        path="/browse/reporter"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['reporter']) ||
          renderReporterList
        }
      />
      <Route
        path="/browse/reporter/:terminalId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['reporter']) ||
          renderReporterDetail
        }
      />

      <Route
        exact
        path="/browse/result"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['result']) ||
          renderResultList
        }
      />
      <Route
        path="/browse/result/:resultId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['result']) ||
          renderResultDetail
        }
      />

      <Route
        exact
        path="/browse/site"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['site']) ||
          renderSiteList
        }
      />
      <Route
        path="/browse/site/:siteId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['site']) ||
          renderSiteDetail
        }
      />

      <Route
        exact
        path="/browse/person"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['person']) ||
          renderPersonList
        }
      />
      <Route
        path="/browse/person/:personId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['person']) ||
          renderPersonDetail
        }
      />

      <Route
        exact
        path="/browse/inventory"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['inventory']) ||
          renderInventoryItemsList
        }
      />

      <Route
        exact
        path="/browse/notification"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['notification']) ||
          renderNotificationList
        }
      />

      <Route
        path="/browse/notification/:notificationId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['notification']) ||
          renderNotificationDetail
        }
      />

      <Route
        exact
        path="/browse/report"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToNotFound(props, ['report']) ||
          renderReportList
        }
      />

      {process.env.NODE_ENV !== 'production' && (
        <Route path="/styleguide" component={StyleguideMain} />
      )}

      <Route render={renderNotFound} />
    </Switch>
  </Router>
)

export default routerFactory

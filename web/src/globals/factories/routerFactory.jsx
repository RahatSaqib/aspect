import _ from 'lodash'
import React from 'react'
import { Router, Switch, Route, Redirect } from 'react-router-dom'
import Paper from 'material-ui/Paper'
import { compose } from 'recompose'

import history from '../../history'
import signedOutFactory from './signedOutFactory'
import loggedInFactory from './loggedInFactory'
import loggedInDetailFactory from './loggedInFactory/detailFactory'

// "Pages"
import LoadableLogin from '../../auth/login/LoadableLogin'
import ResetPassword from '../../auth/resetPassword/ResetPassword'
import LoadableStatus from '../../dashboard/status/LoadableStatus'
import TaskList from '../../task/list/TaskList'
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

const renderLoadableLogin = signedOutFactory(LoadableLogin)
const renderResetPassword = signedOutFactory(ResetPassword)
const renderLoadableStatus = loggedInFactory(LoadableStatus)
const renderTaskList = loggedInFactory(TaskList)
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
const renderDeviceDetail = loggedInFactory(DeviceDetail)
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
        path="/task-list"
        render={renderRedirectToLoginOr(props) || renderTaskList}
      />
      <Route
        path="/operational-data"
        render={renderRedirectToLoginOr(props) || renderOperationalData}
      />

      <Route
        path="/account-details/current"
        render={renderRedirectToLoginOr(props) || renderAccountDetails}
      />

      <Route
        path="/demo/device/:deviceId"
        render={renderRedirectToLoginOr(props) || renderDeviceDemo}
      />

      <Route
        path="/clinical-indicators"
        render={renderRedirectToLoginOr(props) || renderClinicalIndicators}
      />
      <Route
        path="/reports"
        render={renderRedirectToLoginOr(props) || renderReports}
      />
      <Route
        path="/manage"
        render={renderRedirectToLoginOr(props) || renderManage}
      />

      <Redirect exact path="/browse" to="/browse/device" />

      <Route
        exact
        path="/browse/device"
        render={renderRedirectToLoginOr(props) || renderDeviceList}
      />
      <Route
        path="/browse/device/:deviceId"
        render={renderRedirectToLoginOr(props) || renderDeviceDetail}
      />

      <Route
        exact
        path="/browse/deviceApiKey"
        render={renderRedirectToLoginOr(props) || renderDeviceApiKeyList}
      />

      <Route
        exact
        path="/browse/router"
        render={renderRedirectToLoginOr(props) || renderRouterList}
      />
      <Route
        path="/browse/router/:routerId"
        render={renderRedirectToLoginOr(props) || renderRouterDetail}
      />

      <Route
        exact
        path="/browse/reporter"
        render={renderRedirectToLoginOr(props) || renderReporterList}
      />
      <Route
        path="/browse/reporter/:terminalId"
        render={renderRedirectToLoginOr(props) || renderReporterDetail}
      />

      <Route
        exact
        path="/browse/result"
        render={renderRedirectToLoginOr(props) || renderResultList}
      />
      <Route
        path="/browse/result/:resultId"
        render={renderRedirectToLoginOr(props) || renderResultDetail}
      />

      <Route
        exact
        path="/browse/site"
        render={renderRedirectToLoginOr(props) || renderSiteList}
      />
      <Route
        path="/browse/site/:siteId"
        render={renderRedirectToLoginOr(props) || renderSiteDetail}
      />

      <Route
        exact
        path="/browse/person"
        render={renderRedirectToLoginOr(props) || renderPersonList}
      />
      <Route
        path="/browse/person/:personId"
        render={renderRedirectToLoginOr(props) || renderPersonDetail}
      />

      <Route
        exact
        path="/browse/inventory"
        render={renderRedirectToLoginOr(props) || renderInventoryItemsList}
      />

      <Route
        exact
        path="/browse/notification"
        render={renderRedirectToLoginOr(props) || renderNotificationList}
      />

      <Route
        path="/browse/notification/:notificationId"
        render={renderRedirectToLoginOr(props) || renderNotificationDetail}
      />

      <Route
        exact
        path="/browse/report"
        render={renderRedirectToLoginOr(props) || renderReportList}
      />

      {process.env.NODE_ENV !== 'production' && (
        <Route path="/styleguide" component={StyleguideMain} />
      )}

      <Route render={renderNotFound} />
    </Switch>
  </Router>
)

export default routerFactory

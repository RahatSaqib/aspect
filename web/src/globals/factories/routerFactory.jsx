import React from 'react'
import { Router, Switch, Route, Redirect } from 'react-router-dom'
import Paper from 'material-ui/Paper'
import { compose } from 'recompose'

import history from '../../history'
import signedOutFactory from './signedOutFactory'
import loggedInFactory from './loggedInFactory'
import loggedInDetailFactory from './loggedInFactory/detailFactory'
import ensureAuthorizedFactory from './ensureAuthorizedFactory'

// "Pages"
import Index from '../components/Index'
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

const notImplementedLoggedInFactory = compose(loggedInFactory, name => () =>
  <div style={{ padding: 10 }}>
    <Paper style={{ padding: 10 }}>
      {name} is not implemented yet
    </Paper>
  </div>
)

const renderIndex = ensureAuthorizedFactory(Index)
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

export const routerFactory = () => () =>
  <Router history={history}>
    <Switch>
      <Route exact path="/" render={renderIndex} />

      <Route path="/login" render={renderLoadableLogin} />
      <Route path="/reset-password" render={renderResetPassword} />

      <Route exact path="/dashboard" render={renderLoadableStatus} />
      <Route path="/task-list" render={renderTaskList} />
      <Route path="/operational-data" render={renderOperationalData} />

      <Route path="/account-details/current" render={renderAccountDetails} />

      <Route path="/demo/device/:deviceId" render={renderDeviceDemo} />

      <Route path="/clinical-indicators" render={renderClinicalIndicators} />
      <Route path="/reports" render={renderReports} />
      <Route path="/manage" render={renderManage} />

      <Redirect exact path="/browse" to="/browse/device" />

      <Route exact path="/browse/device" render={renderDeviceList} />
      <Route path="/browse/device/:deviceId" render={renderDeviceDetail} />

      <Route
        exact
        path="/browse/deviceApiKey"
        render={renderDeviceApiKeyList}
      />

      <Route exact path="/browse/router" render={renderRouterList} />
      <Route path="/browse/router/:routerId" render={renderRouterDetail} />

      <Route exact path="/browse/reporter" render={renderReporterList} />
      <Route
        path="/browse/reporter/:terminalId"
        render={renderReporterDetail}
      />

      <Route exact path="/browse/result" render={renderResultList} />
      <Route path="/browse/result/:resultId" render={renderResultDetail} />

      <Route exact path="/browse/site" render={renderSiteList} />
      <Route path="/browse/site/:siteId" render={renderSiteDetail} />

      <Route exact path="/browse/person" render={renderPersonList} />
      <Route path="/browse/person/:personId" render={renderPersonDetail} />

      <Route exact path="/browse/inventory" render={renderInventoryItemsList} />

      <Route
        exact
        path="/browse/notification"
        render={renderNotificationList}
      />

      <Route
        path="/browse/notification/:notificationId"
        render={renderNotificationDetail}
      />

      <Route exact path="/browse/report" render={renderReportList} />

      {process.env.NODE_ENV !== 'production' &&
        <Route path="/styleguide" component={StyleguideMain} />}

      <Route render={renderNotFound} />
    </Switch>
  </Router>

export default routerFactory

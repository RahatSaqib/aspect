import _ from 'lodash'
import React from 'react'
import { Router, Switch, Route, Redirect } from 'react-router-dom'
import Paper from '@material-ui/core/Paper'
import { compose } from 'recompose'
import { isPermittedUser } from '../../components/shared/requirePermissions'
import history from '../../history'
import signedOutFactory from './signedOutFactory'
import loggedInFactory from './loggedInFactory'
import loggedInDetailFactory from './loggedInFactory/detailFactory'
import { reduceNavLinks } from '../../filter/utils'
import { navigations } from '../components/BrowseFilters'

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
import CaseList from '../../case/list/CaseList'
import SiteList from '../../site/list/SiteList'
import SiteDetail from '../../site/detail/SiteDetail'
import PersonList from '../../person/list/PersonList'
import PersonDetail from '../../person/detail/PersonDetail'
import ResultList from '../../result/list/ResultList'
import ResultDetail from '../../MigratedComponents/Results/Detail'
import NotificationList from '../../notification/list/NotificationList'
import NotificationDetail from '../../notification/detail/NotificationDetail'
import ReportIndex from '../../report/page/ReportIndex'
import AccountDetails from '../../account/detail/AccountDetails'
import StyleguideMain from '../../styleguide/main/StyleguideMain'
import InventoryItemsList from '../../inventory/list/InventoryItemsList'
import RouterList from '../../router/list/RouterList'
import RouterDetail from '../../router/detail/RouterDetail'
import ReporterList from '../../reporter/list/ReporterList'
import NotFound from '../../error/notFound/NotFound'
import License from '../../auth/license/License'
import ClinicalHistory from '../../patient/ClinicalHistory'
import CaseDetails from '../../case/details/CaseDetails'

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

const makeRenderRedirectToLicense = _.memoize(licenseId => ({ location }) => (
  <Redirect
    to={{
      pathname: '/license',
      state: { referrer: location, licenseId },
    }}
  />
))

const renderRedirectToLicenseOr = props =>
  props.hasToAcceptLicenseId &&
  makeRenderRedirectToLicense(props.hasToAcceptLicenseId)

const renderRedirectToDashboard = ({ permissions }) => ({ location }) => {
  let pathname = ''
  if (isPermittedUser(permissions, ['dashboard'])) {
    pathname = '/dashboard'
  } else if (isPermittedUser(permissions, ['operationalData'])) {
    pathname = '/operational-data'
  } else {
    pathname = '/browse'
  }

  return (
    <Redirect
      to={{
        pathname,
        state: { referrer: location },
      }}
    />
  )
}

const renderRedirectToNotFound = (props, requiredPermission) => {
  if (!isPermittedUser(props.permissions, requiredPermission))
    return renderNotFound
}

const renderRedirectToBrowse = ({ permissions }) => () => {
  const reducedNav = reduceNavLinks(navigations, permissions)
  return <Redirect to={_.head(reducedNav).value || '/browse/device'} />
}

const renderLoadableLogin = signedOutFactory(LoadableLogin)
const renderResetPassword = signedOutFactory(ResetPassword)
const renderLoadableStatus = loggedInFactory(LoadableStatus)
const renderTaskList = loggedInFactory(TaskList)
const renderTaskAggre = loggedInDetailFactory(TaskAggre)
const renderTaskDetail = loggedInDetailFactory(TaskDetail)
const renderOperationalData = loggedInFactory(OperationalData)
const renderAccountDetails = loggedInDetailFactory(AccountDetails)
const renderDeviceDemo = loggedInFactory(DeviceDemo)
/* TODO: real components */
const renderClinicalIndicators = notImplementedLoggedInFactory(
  'Clinical Indicators'
)
const renderReports = loggedInFactory(ReportIndex)
const renderManage = notImplementedLoggedInFactory('Manage')
/* END-TODO: real components */
const renderDeviceList = loggedInFactory(DeviceList)
const renderDeviceDetail = loggedInDetailFactory(DeviceDetail)
const renderDeviceApiKeyList = loggedInFactory(DeviceApiKeyList)
const renderCaseList = loggedInFactory(CaseList)
const renderRouterList = loggedInFactory(RouterList)
const renderRouterDetail = loggedInFactory(RouterDetail)
const renderReporterList = loggedInFactory(ReporterList)
const renderResultList = loggedInFactory(ResultList)
const renderResultDetail = loggedInFactory(ResultDetail)
const renderSiteList = loggedInFactory(SiteList)
const renderSiteDetail = loggedInDetailFactory(SiteDetail)
const renderPersonList = loggedInFactory(PersonList)
const renderPersonDetail = loggedInDetailFactory(PersonDetail)
const renderInventoryItemsList = loggedInFactory(InventoryItemsList)
const renderNotificationList = loggedInFactory(NotificationList)
const renderNotificationDetail = loggedInDetailFactory(NotificationDetail)
const renderClinicalHistory = loggedInDetailFactory(ClinicalHistory)
const renderNotFound = signedOutFactory(NotFound)
const renderLicense = signedOutFactory(License)

const renderRedirectToHomePage = () => {
  return (
    <Redirect
      to={{
        pathname: '/',
      }}
    />
  )
}

const isLoggedInAndOnLogin = ({ isLoggedOut }, { location }) => {
  const { pathname } = location
  const pathsToCheck = ['/login']
  return !isLoggedOut && pathsToCheck.includes(pathname)
}

const renderCaseDetails = loggedInFactory(CaseDetails)
export const routerFactory = () => props => (
  <Router history={history}>
    <Switch>
      <Route
        exact
        path="/"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToDashboard(props)
        }
      />

      <Route
        path="/login"
        render={
          isLoggedInAndOnLogin(props, history)
            ? () => renderRedirectToHomePage()
            : renderLoadableLogin
        }
      />

      <Route path="/reset-password" render={renderResetPassword} />

      <Route
        path="/license"
        render={renderRedirectToLoginOr(props) || renderLicense}
      />

      <Route
        exact
        path="/dashboard"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderLoadableStatus
        }
      />
      <Route
        exact
        path="/task-list"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['task:view']) ||
          renderTaskList
        }
      />
      <Route
        exact
        path="/task-list/aggre-list"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['task:view']) ||
          renderTaskAggre
        }
      />
      <Route
        path="/task-list/:taskId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['task:view']) ||
          renderTaskDetail
        }
      />
      <Route
        path="/operational-data"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['operationalData']) ||
          renderOperationalData
        }
      />

      <Route
        path="/account-details/current"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['account:view']) ||
          renderAccountDetails
        }
      />

      <Route
        path="/demo/device/:deviceId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['deviceDemo']) ||
          renderDeviceDemo
        }
      />

      <Route
        path="/clinical-indicators"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['clinicalIndicators:view']) ||
          renderClinicalIndicators
        }
      />
      <Route
        path="/reports"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['report:view']) ||
          renderReports
        }
      />
      <Route
        path="/manage"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['manage:view']) ||
          renderManage
        }
      />

      <Route exact path="/browse" render={renderRedirectToBrowse(props)} />

      <Route
        exact
        path="/browse/device"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['device:view']) ||
          renderDeviceList
        }
      />
      <Route
        path="/browse/device/:deviceId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['device:view']) ||
          renderDeviceDetail
        }
      />
      <Route
        path="/browse/case/:caseId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['case:edit']) ||
          renderCaseDetails
        }
      />
      <Route
        path="/browse/patient/:patientId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['patient:edit']) ||
          renderClinicalHistory
        }
      />
      <Route
        exact
        path="/browse/deviceApiKey"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['deviceApiKey:view']) ||
          renderDeviceApiKeyList
        }
      />

      <Route
        exact
        path="/browse/case"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['case:view']) ||
          renderCaseList
        }
      />

      <Route
        exact
        path="/browse/router"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['router:view']) ||
          renderRouterList
        }
      />
      <Route
        path="/browse/router/:routerId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['router:view']) ||
          renderRouterDetail
        }
      />

      <Route
        exact
        path="/browse/reporter"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['reporter:view']) ||
          renderReporterList
        }
      />

      <Route
        exact
        path="/browse/result"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['result:view']) ||
          renderResultList
        }
      />
      <Route
        path="/browse/result/:resultId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['result:edit']) ||
          renderResultDetail
        }
      />

      <Route
        exact
        path="/browse/site"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['site:view']) ||
          renderSiteList
        }
      />
      <Route
        path="/browse/site/:siteId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['site:view']) ||
          renderSiteDetail
        }
      />

      <Route
        exact
        path="/browse/person"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['person:view']) ||
          renderPersonList
        }
      />
      <Route
        path="/browse/person/:personId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['person:edit']) ||
          renderPersonDetail
        }
      />

      <Route
        exact
        path="/browse/inventory"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['inventory:view']) ||
          renderInventoryItemsList
        }
      />

      <Route
        exact
        path="/browse/notification"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['notification:view']) ||
          renderNotificationList
        }
      />

      <Route
        path="/browse/notification/:notificationId"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['notification:edit']) ||
          renderNotificationDetail
        }
      />

      <Route
        exact
        path="/browse/report"
        render={
          renderRedirectToLoginOr(props) ||
          renderRedirectToLicenseOr(props) ||
          renderRedirectToNotFound(props, ['report:view'])
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

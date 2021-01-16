import React, { useEffect } from 'react'
import {
  Router,
  Switch,
  Route,
  Redirect,
  useLocation,
  useHistory,
} from 'react-router-dom'
import memoize from 'lodash/memoize'
import head from 'lodash/head'
import Paper from '@material-ui/core/Paper'
import { compose } from 'recompose'

import { RoutesPermissionProvider } from '../../Hooks/RoutePermissions'
import history from '../../history'
import signedOutFactory from './signedOutFactory'
import loggedInFactory from './loggedInFactory'
import loggedInDetailFactory from './loggedInFactory/detailFactory'
import { reduceNavLinks } from '../../filter/utils'
import { navigations } from '../components/BrowseFilters'
import { isPermittedUser } from '../../components/shared/requirePermissions'

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
import DeviceDetail from '../../MigratedComponents/Devices/Detail/DeviceDetail'
import DeviceApiKeyList from '../../deviceApiKey/list/DeviceApiKeyList'
import CaseList from '../../case/list/CaseList'
import SiteList from '../../site/list/SiteList'
import SiteDetail from '../../MigratedComponents/Sites/Detail/SiteDetail'
import PersonList from '../../person/list/PersonList'
import PersonDetail from '../../person/detail/PersonDetail'
import ResultList from '../../result/list/ResultList'
import ResultDetail from '../../MigratedComponents/Results/Detail'
import NotificationList from '../../notification/list/NotificationList'
import NotificationDetail from '../../MigratedComponents/Notifications'
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

function useHashAndScroll() {
  const location = useLocation()
  useEffect(() => {
    const { hash } = location
    setTimeout(() => {
      const nodeList = document.querySelectorAll(
        `[name="${hash.replace('#', '')}"]`
      )
      if (nodeList && nodeList.length) {
        nodeList[0].scrollIntoView({ behavior: 'smooth' })
      }
    }, 0)
  }, [location])
}

const notImplementedLoggedInFactory = compose(loggedInFactory, name => () => (
  <div style={{ padding: 10 }}>
    <Paper style={{ padding: 10 }}>{name} is not implemented yet</Paper>
  </div>
))

const makeRenderRedirectToLoginWithReason = memoize(
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

const makeRenderRedirectToLicense = memoize(licenseId => ({ location }) => (
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
  if (isPermittedUser(permissions, { required: ['dashboard:summary'] })) {
    pathname = '/dashboard'
  } else if (isPermittedUser(permissions, { required: ['operationalData'] })) {
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
  if (!isPermittedUser(props.permissions, { required: requiredPermission }))
    return renderNotFound
}

const renderRedirectToBrowse = ({ permissions }) => () => {
  const reducedNav = reduceNavLinks(navigations, permissions)
  return <Redirect to={head(reducedNav).value || '/browse/device'} />
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
const renderDeviceDetail = loggedInFactory(DeviceDetail)
const renderDeviceApiKeyList = loggedInFactory(DeviceApiKeyList)
const renderCaseList = loggedInFactory(CaseList)
const renderRouterList = loggedInFactory(RouterList)
const renderRouterDetail = loggedInFactory(RouterDetail)
const renderReporterList = loggedInFactory(ReporterList)
const renderResultList = loggedInFactory(ResultList)
const renderResultDetail = loggedInFactory(ResultDetail)
const renderSiteList = loggedInFactory(SiteList)
const renderSiteDetail = loggedInFactory(SiteDetail)
const renderPersonList = loggedInFactory(PersonList)
const renderPersonDetail = loggedInDetailFactory(PersonDetail)
const renderInventoryItemsList = loggedInFactory(InventoryItemsList)
const renderNotificationList = loggedInFactory(NotificationList)
const renderNotificationDetail = loggedInFactory(NotificationDetail)
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

const AppRoutes = ({ props }) => {
  useHashAndScroll()
  return (
    <RoutesPermissionProvider>
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
          permissions={['dashboard:summary']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['dashboard:summary']) ||
            renderLoadableStatus
          }
        />
        <Route
          exact
          path="/task-list"
          permissions={['task']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['task']) ||
            renderTaskList
          }
        />
        <Route
          exact
          path="/task-list/aggre-list"
          permissions={['task']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['task']) ||
            renderTaskAggre
          }
        />
        <Route
          path="/task-list/:taskId"
          permissions={['task']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['task']) ||
            renderTaskDetail
          }
        />
        <Route
          path="/operational-data"
          permissions={['operationalData']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['operationalData']) ||
            renderOperationalData
          }
        />

        <Route
          path="/account-details/current"
          permissions={['account']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['account']) ||
            renderAccountDetails
          }
        />

        <Route
          path="/demo/device/:deviceId"
          permissions={['deviceDemo']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['deviceDemo']) ||
            renderDeviceDemo
          }
        />

        <Route
          path="/clinical-indicators"
          permissions={['clinicalIndicators:view']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['clinicalIndicators:view']) ||
            renderClinicalIndicators
          }
        />
        <Route
          path="/reports"
          permissions={['report']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['report']) ||
            renderReports
          }
        />
        <Route
          path="/manage"
          permissions={['manage']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['manage']) ||
            renderManage
          }
        />

        <Route
          exact
          path="/browse"
          permissions={['browse']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse']) ||
            renderRedirectToBrowse(props)
          }
        />

        <Route
          exact
          path="/browse/device"
          permissions={['browse', 'device']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'device']) ||
            renderDeviceList
          }
        />
        <Route
          path="/browse/device/:deviceId"
          permissions={['browse', 'device']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'device']) ||
            renderDeviceDetail
          }
        />
        <Route
          path="/browse/case/:caseId"
          permissions={['browse', 'case:edit']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'case:edit']) ||
            renderCaseDetails
          }
        />
        <Route
          path="/browse/patient/:patientId"
          permissions={['browse', 'patient:edit']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'patient:edit']) ||
            renderClinicalHistory
          }
        />
        <Route
          exact
          path="/browse/deviceApiKey"
          permissions={['browse', 'deviceApiKey']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'deviceApiKey']) ||
            renderDeviceApiKeyList
          }
        />

        <Route
          exact
          path="/browse/case"
          permissions={['browse', 'case']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'case']) ||
            renderCaseList
          }
        />

        <Route
          exact
          path="/browse/router"
          permissions={['browse', 'router']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'router']) ||
            renderRouterList
          }
        />
        <Route
          path="/browse/router/:routerId"
          permissions={['browse', 'router']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'router']) ||
            renderRouterDetail
          }
        />

        <Route
          exact
          path="/browse/reporter"
          permissions={['browse', 'reporter']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'reporter']) ||
            renderReporterList
          }
        />

        <Route
          exact
          path="/browse/result"
          permissions={['browse', 'result']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'result']) ||
            renderResultList
          }
        />
        <Route
          path="/browse/result/:resultId"
          permissions={['browse', 'result:edit']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'result:edit']) ||
            renderResultDetail
          }
        />

        <Route
          exact
          path="/browse/site"
          permissions={['browse', 'site']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'site']) ||
            renderSiteList
          }
        />
        <Route
          path="/browse/site/:siteId"
          permissions={['browse', 'site']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'site']) ||
            renderSiteDetail
          }
        />

        <Route
          exact
          path="/browse/person"
          permissions={['browse', 'person']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'person']) ||
            renderPersonList
          }
        />
        <Route
          path="/browse/person/:personId"
          permissions={['browse', 'person:edit']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'person:edit']) ||
            renderPersonDetail
          }
        />

        <Route
          exact
          path="/browse/inventory"
          permissions={['browse', 'inventory']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'inventory']) ||
            renderInventoryItemsList
          }
        />

        <Route
          exact
          path="/browse/notification"
          permissions={['browse', 'notification']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'notification']) ||
            renderNotificationList
          }
        />

        <Route
          path="/browse/notification/:notificationId"
          permissions={['browse', 'notification:edit']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'notification:edit']) ||
            renderNotificationDetail
          }
        />

        <Route
          exact
          path="/browse/report"
          permissions={['browse', 'report']}
          render={
            renderRedirectToLoginOr(props) ||
            renderRedirectToLicenseOr(props) ||
            renderRedirectToNotFound(props, ['browse', 'report'])
          }
        />

        {process.env.NODE_ENV !== 'production' && (
          <Route path="/styleguide" component={StyleguideMain} />
        )}

        <Route render={renderNotFound} />
      </Switch>
    </RoutesPermissionProvider>
  )
}

export const routerFactory = () => props => {
  return (
    <Router history={history}>
      <AppRoutes props={props} />
    </Router>
  )
}

export default routerFactory

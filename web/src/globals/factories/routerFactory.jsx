import React, { useEffect } from 'react'
import {
  BrowserRouter as Router,
  Route as RouteOriginal,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import memoize from 'lodash/memoize'
import head from 'lodash/head'
import Paper from '@material-ui/core/Paper'
import { compose } from 'recompose'

import { RoutesPermissionProvider } from '../../Providers/RoutePermissions'
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
import NotificationList from '../../MigratedComponents/Notifications/List'
import NotificationDetail from '../../MigratedComponents/Notifications/Detail'
import NotificationDetailHistory from '../../MigratedComponents/Notifications/Detail/NotificationDetailHistory'
import ReportIndex from '../../report/page/ReportIndex'
import AccountDetails from '../../account/detail/AccountDetails'
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
    const { hash = '' } = location
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

const makeRenderRedirectToLoginWithReason = memoize((reason, location) => (
  <Navigate replace to="/login" state={{ referrer: location, reason }} />
))

const renderRedirectToLoginOr = ({
  isLoggedOut,
  loggedOutReason,
  location,
}) => {
  return (
    (isLoggedOut || loggedOutReason === 'idle') &&
    makeRenderRedirectToLoginWithReason(loggedOutReason, location)
  )
}

const makeRenderRedirectToLicense = memoize((licenseId, location) => (
  <Navigate replace to="/license" state={{ referrer: location, licenseId }} />
))

const renderRedirectToLicenseOr = ({ location, hasToAcceptLicenseId }) => {
  return (
    hasToAcceptLicenseId &&
    makeRenderRedirectToLicense(hasToAcceptLicenseId, location)
  )
}

const renderRedirectToDashboard = ({ location, permissions }) => {
  let pathname = ''
  if (isPermittedUser(permissions, { required: ['dashboard:summary'] })) {
    pathname = '/dashboard'
  } else if (isPermittedUser(permissions, { required: ['operationalData'] })) {
    pathname = '/operational-data'
  } else {
    pathname = '/browse'
  }
  return <Navigate replace to={pathname} state={{ referrer: location }} />
}

const renderRedirectToNotFound = (props, requiredPermission) => {
  if (!isPermittedUser(props.permissions, { required: requiredPermission }))
    return renderNotFound
}

const renderRedirectToBrowse = ({ permissions }) => {
  const reducedNav = reduceNavLinks(navigations, permissions)
  return <Navigate to={head(reducedNav).value || '/browse/device'} />
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
const renderNotificationDetailHistory = loggedInFactory(
  NotificationDetailHistory
)
const renderClinicalHistory = loggedInDetailFactory(ClinicalHistory)
const renderNotFound = signedOutFactory(NotFound)
const renderLicense = signedOutFactory(License)

const renderRedirectToHomePage = () => {
  return (
    <Navigate
      replace
      to={{
        pathname: '/',
      }}
    />
  )
}

const isLoggedInAndOnLogin = ({ isLoggedOut, loggedOutReason, location }) => {
  const { pathname } = location
  const pathsToCheck = ['/login']
  return (
    !(isLoggedOut || loggedOutReason === 'idle') &&
    pathsToCheck.includes(pathname)
  )
}

const renderCaseDetails = loggedInFactory(CaseDetails)

const RenderTo = ({ props, permissions, render, checkLicense = true }) => {
  const RedirectToLogin = renderRedirectToLoginOr(props)
  if (RedirectToLogin) {
    return RedirectToLogin
  }
  if (checkLicense) {
    const RedirectToLicense = renderRedirectToLicenseOr(props)
    if (RedirectToLicense) {
      return RedirectToLicense
    }
  }
  if (permissions) {
    const RedirectToNotFound = renderRedirectToNotFound(props, permissions)
    if (RedirectToNotFound) {
      return RedirectToNotFound
    }
  }

  return render(props)
}

const AppRoutes = ({ props: outerProps }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const props = {
    ...outerProps,
    location,
    navigate,
  }
  const Route = ({ path, children, render, ...rest }) => {
    let routeProps = {}
    if (path) {
      routeProps = {
        ...routeProps,
        path,
      }
    }
    if (render) {
      routeProps = {
        ...routeProps,
        element: <RenderTo {...rest} render={render} props={props} />,
      }
    }
    return <RouteOriginal {...routeProps}>{children}</RouteOriginal>
  }

  useHashAndScroll()
  return (
    <RoutesPermissionProvider>
      <Routes>
        <Route path="/" render={renderRedirectToDashboard} />

        <Route path="/login">
          {isLoggedInAndOnLogin(props)
            ? renderRedirectToHomePage(props)
            : renderLoadableLogin(props)}
        </Route>

        <Route path="/reset-password" element={renderResetPassword(props)} />

        <Route path="/license">
          {renderRedirectToLoginOr(props) || renderLicense(props)}
        </Route>
        <Route
          path="/dashboard"
          permissions={['dashboard:summary']}
          render={renderLoadableStatus}
        />
        <Route
          path="/task-list"
          permissions={['task']}
          render={renderTaskList}
        />
        <Route
          path="/task-list/aggre-list"
          permissions={['task']}
          render={renderTaskAggre}
        />
        <Route
          path="/task-list/:taskId"
          permissions={['task']}
          render={renderTaskDetail}
        />
        <Route
          path="/operational-data/*"
          permissions={['operationalData']}
          render={renderOperationalData}
        />
        <Route
          path="/account-details/current/*"
          permissions={['account']}
          render={renderAccountDetails}
        />

        <Route
          path="/demo/device/:deviceId"
          permissions={['deviceDemo']}
          render={renderDeviceDemo}
        />
        <Route
          path="/clinical-indicators"
          permissions={['clinicalIndicators:view']}
          render={renderClinicalIndicators}
        />
        <Route
          path="/reports"
          permissions={['report']}
          render={renderReports}
        />

        <Route path="/manage" permissions={['manage']} render={renderManage} />

        <Route
          path="/browse"
          permissions={['browse']}
          render={renderRedirectToBrowse}
        />
        <Route
          path="/browse/device"
          permissions={['browse', 'device']}
          render={renderDeviceList}
        />
        <Route
          path="/browse/device/:deviceId/*"
          permissions={['browse', 'device']}
          render={renderDeviceDetail}
        />
        <Route
          path="/browse/case/:caseId"
          permissions={['browse', 'case:edit']}
          render={renderCaseDetails}
        />
        <Route
          path="/browse/patient/:patientId"
          permissions={['browse', 'patient:edit']}
          render={renderClinicalHistory}
        />
        <Route
          path="/browse/deviceApiKey"
          permissions={['browse', 'deviceApiKey']}
          render={renderDeviceApiKeyList}
        />
        <Route
          path="/browse/case"
          permissions={['browse', 'case']}
          render={renderCaseList}
        />
        <Route
          path="/browse/router"
          permissions={['browse', 'router']}
          render={renderRouterList}
        />
        <Route
          path="/browse/router/:routerId"
          permissions={['browse', 'router']}
          render={renderRouterDetail}
        />
        <Route
          path="/browse/reporter"
          permissions={['browse', 'reporter']}
          render={renderReporterList}
        />
        <Route
          path="/browse/result"
          permissions={['browse', 'result']}
          render={renderResultList}
        />
        <Route
          path="/browse/result/:resultId"
          permissions={['browse', 'result:edit']}
          render={renderResultDetail}
        />
        <Route
          path="/browse/site"
          permissions={['browse', 'site']}
          render={renderSiteList}
        />
        <Route
          path="/browse/site/:siteId/*"
          permissions={['browse', 'site']}
          render={renderSiteDetail}
        />
        <Route
          path="/browse/person"
          permissions={['browse', 'person']}
          render={renderPersonList}
        />
        <Route
          path="/browse/person/:personId"
          permissions={['browse', 'person:edit']}
          render={renderPersonDetail}
        />
        <Route
          path="/browse/inventory"
          permissions={['browse', 'inventory']}
          render={renderInventoryItemsList}
        />
        <Route
          path="/browse/notification"
          permissions={['browse', 'notification']}
          render={renderNotificationList}
        />
        <Route
          path="/browse/notification/:notificationId"
          permissions={['browse', 'notification:edit']}
          render={renderNotificationDetail}
        />
        <Route
          path="/browse/notification/:notificationId/history"
          permissions={['browse', 'notification']}
          render={renderNotificationDetailHistory}
        />
        <Route
          path="/browse/report"
          permissions={['browse', 'report']}
          render={renderRedirectToNotFound}
        />
        <Route>{renderNotFound(props)}</Route>
      </Routes>
    </RoutesPermissionProvider>
  )
}

export const routerFactory = () => props =>
  (
    <Router history={history}>
      <AppRoutes props={props} />
    </Router>
  )

export default routerFactory

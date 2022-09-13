import React, { useEffect } from 'react'
import Paper from '@mui/material/Paper'
import head from 'lodash/head'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { navigations } from './oldComponents/BrowseFilters'
import DetailLayout from './oldComponents/DetailLayout'
import { reduceNavLinks } from './oldComponents/filter/utils'
import LoggedInLayout from './oldComponents/LoggedInLayout'
import { isPermittedUser } from './oldComponents/shared/requirePermissions'
import SignedOutLayout from './oldComponents/SignedOutLayout'
import AccountDetails from './oldPages/account/detail/AccountDetails'
import License from './oldPages/auth/license/License'
import LoadableLogin from './oldPages/auth/login/LoadableLogin'
import ResetPassword from './oldPages/auth/resetPassword/ResetPassword'
import CaseDetails from './oldPages/case/details/CaseDetails'
import CaseList from './oldPages/case/list/CaseList'
import OperationalData from './oldPages/dashboard/operational/OperationalData'
import LoadableStatus from './oldPages/dashboard/status/LoadableStatus'
import DeviceList from './oldPages/device/list/DeviceList'
import DeviceApiKeyList from './oldPages/deviceApiKey/list/DeviceApiKeyList'
import InventoryContainer from './oldPages/inventory/InventoryContainer'
import ClinicalHistory from './oldPages/patient/ClinicalHistory'
import PersonDetail from './oldPages/person/detail/PersonDetail'
import PersonList from './oldPages/person/list/PersonList'
import ReportIndex from './oldPages/report/page/ReportIndex'
import ReporterList from './oldPages/reporter/list/ReporterList'
import ResultList from './oldPages/result/list/ResultList'
import RouterDetail from './oldPages/router/detail/RouterDetail'
import RouterList from './oldPages/router/list/RouterList'
import TaskAggre from './oldPages/task/aggre/TaskAggre'
import TaskDetail from './oldPages/task/detail/TaskDetail'
import TaskList from './oldPages/task/list/TaskList'
import DeviceDetail from './pages/Devices/Detail/DeviceDetail'
import NotFound from './pages/NotFound/NotFound'
import NotificationDetail from './pages/Notifications/Detail'
import NotificationDetailHistory from './pages/Notifications/Detail/NotificationDetailHistory'
import NotificationList from './pages/Notifications/List'
import ResultDetail from './pages/Results/Detail'
import SiteDetail, { EditSite } from './pages/Site/Detail'
import SiteList from './pages/Site/List'
import Welcome from './pages/Welcome'
import { RoutesPermissionProvider } from './providers/RoutePermissions'

function useHashAndScroll() {
  const location = useLocation()
  useEffect(() => {
    const { hash = '' } = location
    setTimeout(() => {
      const nodeList = document.querySelectorAll(`[name="${hash.replace('#', '')}"]`)
      if (nodeList && nodeList.length) {
        nodeList[0].scrollIntoView({ behavior: 'smooth' })
      }
    }, 0)
  }, [location])
}

const getElement = (props, permissions, render) => {
  return <RenderTo render={render} props={props} permissions={permissions} />
}

const renderRedirectToLoginOr = ({ isLoggedOut, loggedOutReason, location }) => {
  return isLoggedOut || loggedOutReason === 'idle' ? (
    <Navigate replace to="/login" state={{ referrer: location, reason: loggedOutReason }} />
  ) : null
}

const renderRedirectToLicenseOr = ({ location, hasToAcceptLicenseId }) => {
  return hasToAcceptLicenseId ? (
    <Navigate replace to="/license" state={{ referrer: location, licenseId: hasToAcceptLicenseId }} />
  ) : null
}

const renderRedirectToDashboard = ({ location, permissions }) => {
  let pathname = ''
  if (isPermittedUser(permissions, { required: ['dashboard:summary'] })) {
    pathname = '/dashboard'
  } else if (isPermittedUser(permissions, { required: ['operationalData'] })) {
    pathname = '/operational-data'
  } else {
    pathname = '/welcome'
  }
  return <Navigate replace to={pathname} state={{ referrer: location }} />
}

const renderRedirectToBrowse = ({ permissions }) => {
  const reducedNav = reduceNavLinks(navigations, permissions)
  return <Navigate to={head(reducedNav).value || '/browse/device'} />
}

const renderClinicalIndicators = () => (
  <LoggedInLayout>
    <div style={{ padding: 10 }}>
      <Paper style={{ padding: 10 }}>Clinical Indicators is not implemented yet</Paper>
    </div>
  </LoggedInLayout>
)

const renderManage = () => (
  <LoggedInLayout>
    <div style={{ padding: 10 }}>
      <Paper style={{ padding: 10 }}>Manage is not implemented yet</Paper>
    </div>
  </LoggedInLayout>
)

const renderTaskAggre = props => (
  <DetailLayout>
    <TaskAggre {...props} />
  </DetailLayout>
)
const renderTaskDetail = props => (
  <DetailLayout>
    <TaskDetail {...props} />
  </DetailLayout>
)
const renderAccountDetails = props => (
  <DetailLayout>
    <AccountDetails {...props} />
  </DetailLayout>
)
const renderPersonDetail = props => (
  <DetailLayout>
    <PersonDetail {...props} />
  </DetailLayout>
)
const renderClinicalHistory = props => (
  <DetailLayout>
    <ClinicalHistory {...props} />
  </DetailLayout>
)
const renderLoadableLogin = props => (
  <SignedOutLayout>
    <LoadableLogin {...props} />
  </SignedOutLayout>
)
const renderResetPassword = props => (
  <SignedOutLayout>
    <ResetPassword {...props} />
  </SignedOutLayout>
)
const renderNotFound = props => (
  <SignedOutLayout>
    <NotFound {...props} />
  </SignedOutLayout>
)
const renderLicense = props => (
  <SignedOutLayout>
    <License {...props} />
  </SignedOutLayout>
)
const renderLoadableStatus = props => (
  <LoggedInLayout>
    <LoadableStatus {...props} />
  </LoggedInLayout>
)
const renderTaskList = props => (
  <LoggedInLayout>
    <TaskList {...props} />
  </LoggedInLayout>
)
const renderOperationalData = props => (
  <LoggedInLayout>
    <OperationalData {...props} />
  </LoggedInLayout>
)
const renderReports = props => (
  <LoggedInLayout>
    <ReportIndex {...props} />
  </LoggedInLayout>
)
const renderDeviceList = props => (
  <LoggedInLayout>
    <DeviceList {...props} />
  </LoggedInLayout>
)
const renderDeviceDetail = props => (
  <LoggedInLayout>
    <DeviceDetail {...props} />
  </LoggedInLayout>
)
const renderDeviceApiKeyList = props => (
  <LoggedInLayout>
    <DeviceApiKeyList {...props} />
  </LoggedInLayout>
)
const renderCaseList = props => (
  <LoggedInLayout>
    <CaseList {...props} />
  </LoggedInLayout>
)
const renderRouterList = props => (
  <LoggedInLayout>
    <RouterList {...props} />
  </LoggedInLayout>
)
const renderRouterDetail = props => (
  <LoggedInLayout>
    <RouterDetail {...props} />
  </LoggedInLayout>
)
const renderReporterList = props => (
  <LoggedInLayout>
    <ReporterList {...props} />
  </LoggedInLayout>
)
const renderResultList = props => (
  <LoggedInLayout>
    <ResultList {...props} />
  </LoggedInLayout>
)
const renderResultDetail = props => (
  <LoggedInLayout>
    <ResultDetail {...props} />
  </LoggedInLayout>
)
const renderSiteList = props => (
  <LoggedInLayout>
    <SiteList {...props} />
  </LoggedInLayout>
)
const renderEditSite = props => (
  <LoggedInLayout>
    <EditSite {...props} />
  </LoggedInLayout>
)
const renderSiteDetail = props => (
  <LoggedInLayout>
    <SiteDetail {...props} />
  </LoggedInLayout>
)
const renderPersonList = props => (
  <LoggedInLayout>
    <PersonList {...props} />
  </LoggedInLayout>
)
const renderInventoryContainer = props => (
  <LoggedInLayout>
    <InventoryContainer {...props} />
  </LoggedInLayout>
)
const renderNotificationList = props => (
  <LoggedInLayout>
    <NotificationList {...props} />
  </LoggedInLayout>
)
const renderNotificationDetail = props => (
  <LoggedInLayout>
    <NotificationDetail {...props} />
  </LoggedInLayout>
)
const renderNotificationDetailHistory = props => (
  <LoggedInLayout>
    <NotificationDetailHistory {...props} />
  </LoggedInLayout>
)
const renderWelcome = props => (
  <LoggedInLayout>
    <Welcome {...props} />
  </LoggedInLayout>
)
const renderCaseDetails = props => (
  <LoggedInLayout>
    <CaseDetails {...props} />
  </LoggedInLayout>
)

const renderRedirectToHomePage = () => {
  return <Navigate replace to={{ pathname: '/' }} />
}

const isLoggedInAndOnLogin = ({ isLoggedOut, loggedOutReason, location }) => {
  const { pathname } = location
  const pathsToCheck = ['/login']
  return !(isLoggedOut || loggedOutReason === 'idle') && pathsToCheck.includes(pathname)
}

const RenderTo = ({ props, permissions, render }) => {
  const RedirectToLogin = renderRedirectToLoginOr(props)
  if (RedirectToLogin) {
    return RedirectToLogin
  }

  const RedirectToLicense = renderRedirectToLicenseOr(props)
  if (RedirectToLicense) {
    return RedirectToLicense
  }

  if (permissions) {
    if (!isPermittedUser(props.permissions, { required: permissions })) return getElement(props, [], renderNotFound)
  }

  return render(props)
}

const Pages = ({ countryId, countryAbbreviation, hasToAcceptLicenseId, isLoggedOut, loggedOutReason, permissions }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => window.scrollTo(0, 0), [location.pathname])

  const props = {
    countryId,
    countryAbbreviation,
    hasToAcceptLicenseId,
    isLoggedOut,
    loggedOutReason,
    permissions,
    location,
    navigate,
  }

  useHashAndScroll()
  return (
    <RoutesPermissionProvider>
      <Routes>
        <Route path="/" element={getElement(props, null, renderRedirectToDashboard)} />

        <Route
          path="/login"
          element={isLoggedInAndOnLogin(props) ? renderRedirectToHomePage(props) : renderLoadableLogin(props)}
        />

        <Route path="/reset-password" element={renderResetPassword(props)} />

        <Route path="/license" element={renderRedirectToLoginOr(props) || renderLicense(props)} />

        <Route path="/dashboard" element={getElement(props, ['dashboard:summary'], renderLoadableStatus)} />

        <Route path="/task-list" element={getElement(props, ['task'], renderTaskList)} />
        <Route path="/task-list/aggre-list" element={getElement(props, ['task'], renderTaskAggre)} />
        <Route path="/task-list/:taskId" element={getElement(props, ['task'], renderTaskDetail)} />

        <Route path="/operational-data/*" element={getElement(props, ['operationalData'], renderOperationalData)} />

        <Route path="/account-details/current/*" element={getElement(props, ['account'], renderAccountDetails)} />

        <Route
          path="/clinical-indicators"
          element={getElement(props, ['clinicalIndicators:view'], renderClinicalIndicators)}
        />

        <Route path="/reports" element={getElement(props, ['report'], renderReports)} />

        <Route path="/manage" element={getElement(props, ['manage'], renderManage)} />

        <Route path="/browse" element={getElement(props, ['browse'], renderRedirectToBrowse)} />

        <Route path="/browse/device" element={getElement(props, ['browse', 'device'], renderDeviceList)} />
        <Route
          path="/browse/device/:deviceId/*"
          element={getElement(props, ['browse', 'device'], renderDeviceDetail)}
        />

        <Route path="/browse/case/:caseId" element={getElement(props, ['browse', 'case:edit'], renderCaseDetails)} />
        <Route path="/browse/case" element={getElement(props, ['browse', 'case'], renderCaseList)} />

        <Route
          path="/browse/patient/:patientId"
          element={getElement(props, ['browse', 'patient:edit'], renderClinicalHistory)}
        />

        <Route
          path="/browse/deviceApiKey"
          element={getElement(props, ['browse', 'deviceApiKey'], renderDeviceApiKeyList)}
        />

        <Route path="/browse/router" element={getElement(props, ['browse', 'router'], renderRouterList)} />
        <Route path="/browse/router/:routerId" element={getElement(props, ['browse', 'router'], renderRouterDetail)} />

        <Route path="/browse/reporter" element={getElement(props, ['browse', 'reporter'], renderReporterList)} />

        <Route path="/browse/result" element={getElement(props, ['browse', 'result'], renderResultList)} />
        <Route
          path="/browse/result/:resultId/*"
          element={getElement(props, ['browse', 'result:edit'], renderResultDetail)}
        />

        <Route path="/browse/site" element={getElement(props, ['browse', 'site'], renderSiteList)} />
        <Route path="/browse/site/create" element={getElement(props, ['browse', 'site'], renderEditSite)} />
        <Route path="/browse/site/:siteId/*" element={getElement(props, ['browse', 'site'], renderSiteDetail)} />

        <Route path="/browse/person" element={getElement(props, ['browse', 'person'], renderPersonList)} />
        <Route
          path="/browse/person/:personId/*"
          element={getElement(props, ['browse', 'person:edit'], renderPersonDetail)}
        />

        <Route
          path="/browse/inventory/*"
          element={getElement(props, ['browse', 'inventory'], renderInventoryContainer)}
        />

        <Route
          path="/browse/notification"
          element={getElement(props, ['browse', 'notification'], renderNotificationList)}
        />
        <Route
          path="/browse/notification/:notificationId"
          element={getElement(props, ['browse', 'notification:edit'], renderNotificationDetail)}
        />
        <Route
          path="/browse/notification/:notificationId/history"
          element={getElement(props, ['browse', 'notification'], renderNotificationDetailHistory)}
        />

        <Route path="/browse/report" element={getElement(props, ['browse', 'report'], renderNotFound)} />

        <Route path="/welcome" element={getElement(props, [], renderWelcome)} />
        <Route path="*" element={getElement(props, [], renderNotFound)} />
      </Routes>
    </RoutesPermissionProvider>
  )
}

export default Pages

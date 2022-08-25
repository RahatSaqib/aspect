/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import memoize from 'lodash/memoize'
import head from 'lodash/head'
import Paper from '@mui/material/Paper'
import { compose } from 'recompose'

import { RoutesPermissionProvider } from '../../providers/RoutePermissions'
import history from '../../history'
import signedOutFactory from './signedOutFactory'
import loggedInFactory from './loggedInFactory'
import loggedInDetailFactory from './loggedInFactory/detailFactory'
import { reduceNavLinks } from '../../oldComponents/filter/utils'
import { navigations } from '../../oldComponents/BrowseFilters'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'

// "Pages"
import AccountDetails from '../../oldPages/account/detail/AccountDetails'
import LoadableLogin from '../../oldPages/auth/login/LoadableLogin'
import ResetPassword from '../../oldPages/auth/resetPassword/ResetPassword'
import License from '../../oldPages/auth/license/License'

import CaseList from '../../oldPages/case/list/CaseList'
import CaseDetails from '../../oldPages/case/details/CaseDetails'

import LoadableStatus from '../../oldPages/dashboard/status/LoadableStatus'
import OperationalData from '../../oldPages/dashboard/operational/OperationalData'

import DeviceDemo from '../../oldPages/demo/device/DeviceDemo'

import DeviceList from '../../oldPages/device/list/DeviceList'

import DeviceApiKeyList from '../../oldPages/deviceApiKey/list/DeviceApiKeyList'

import InventoryContainer from '../../oldPages/inventory/InventoryContainer'

import NotFound from '../../pages/NotFound/NotFound'

import ClinicalHistory from '../../oldPages/patient/ClinicalHistory'

import PersonList from '../../oldPages/person/list/PersonList'
import PersonDetail from '../../oldPages/person/detail/PersonDetail'

import ReportIndex from '../../oldPages/report/page/ReportIndex'

import ReporterList from '../../oldPages/reporter/list/ReporterList'

import ResultList from '../../oldPages/result/list/ResultList'

import RouterList from '../../oldPages/router/list/RouterList'
import RouterDetail from '../../oldPages/router/detail/RouterDetail'

import SiteList from '../../oldPages/site/list/SiteList'

import TaskList from '../../oldPages/task/list/TaskList'
import TaskAggre from '../../oldPages/task/aggre/TaskAggre'
import TaskDetail from '../../oldPages/task/detail/TaskDetail'

///
// import SiteDetail from '../../components/Sites/Detail/SiteDetail'
import SiteDetail, { EditSite } from '../../pages/SiteDetailPage'

import DeviceDetail from '../../pages/Devices/Detail/DeviceDetail'
import NotificationList from '../../pages/Notifications/List'
import NotificationDetail from '../../pages/Notifications/Detail'
import NotificationDetailHistory from '../../pages/Notifications/Detail/NotificationDetailHistory'
import ResultDetail from '../../pages/Results/Detail'
import Welcome from '../../pages/Welcome'

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

const notImplementedLoggedInFactory = compose(loggedInFactory, name => () => (
  <div style={{ padding: 10 }}>
    <Paper style={{ padding: 10 }}>{name} is not implemented yet</Paper>
  </div>
))

const makeRenderRedirectToLoginWithReason = memoize((reason, location) => (
  <Navigate replace to="/login" state={{ referrer: location, reason }} />
))

const getElement = (props, permissions, render) => {
  return <RenderTo render={render} props={props} permissions={permissions} />
}

const renderRedirectToLoginOr = ({ isLoggedOut, loggedOutReason, location }) => {
  return (isLoggedOut || loggedOutReason === 'idle') && makeRenderRedirectToLoginWithReason(loggedOutReason, location)
}

const makeRenderRedirectToLicense = memoize((licenseId, location) => (
  <Navigate replace to="/license" state={{ referrer: location, licenseId }} />
))

const renderRedirectToLicenseOr = ({ location, hasToAcceptLicenseId }) => {
  return hasToAcceptLicenseId && makeRenderRedirectToLicense(hasToAcceptLicenseId, location)
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

const renderRedirectToNotFound = (props, requiredPermission) => {
  if (!isPermittedUser(props.permissions, { required: requiredPermission }))
    return getElement(props, [], renderNotFound)
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
const renderClinicalIndicators = notImplementedLoggedInFactory('Clinical Indicators')
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
const renderEditSite = loggedInFactory(EditSite)
const renderSiteDetail = loggedInFactory(SiteDetail)
const renderPersonList = loggedInFactory(PersonList)
const renderPersonDetail = loggedInDetailFactory(PersonDetail)

const renderInventoryContainer = loggedInFactory(InventoryContainer)
const renderNotificationList = loggedInFactory(NotificationList)
const renderNotificationDetail = loggedInFactory(NotificationDetail)
const renderNotificationDetailHistory = loggedInFactory(NotificationDetailHistory)
const renderWelcome = loggedInFactory(Welcome)
const renderClinicalHistory = loggedInDetailFactory(ClinicalHistory)
const renderNotFound = signedOutFactory(NotFound)
const renderLicense = signedOutFactory(License)

const renderRedirectToHomePage = () => {
  return <Navigate replace to={{ pathname: '/' }} />
}

const isLoggedInAndOnLogin = ({ isLoggedOut, loggedOutReason, location }) => {
  const { pathname } = location
  const pathsToCheck = ['/login']
  return !(isLoggedOut || loggedOutReason === 'idle') && pathsToCheck.includes(pathname)
}

const renderCaseDetails = loggedInFactory(CaseDetails)

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

  const props = { ...outerProps, location, navigate }

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

        <Route path="/demo/device/:deviceId" element={getElement(props, ['deviceDemo'], renderDeviceDemo)} />

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

export const routerFactory = () => props =>
  (
    <Router history={history}>
      <AppRoutes props={props} />
    </Router>
  )

export default routerFactory

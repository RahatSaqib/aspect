import React, { useEffect } from 'react'
import head from 'lodash/head'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { navigations } from './oldComponents/BrowseFilters'
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
import DeviceContainer from './pages/Devices/DeviceContainer'
import NotFound from './pages/NotFound/NotFound'
import NotificationDetail from './pages/Notification/NotificationFormPage'
import NotificationDetailHistory from './pages/Notification/NotificationHistoryPage'
import NotificationList from './pages/Notification/NotificationListPage'
import ResultDetail from './pages/Results/Detail'
import SiteDetail, { EditSite } from './pages/Site/Detail'
import SiteList from './pages/Site/List'
import Welcome from './pages/Welcome'
import { useAuthState } from './providers/AuthProvider'
import { RoutesPermissionProvider } from './providers/RoutePermissions'

const Auth = ({ required, page }) => {
  const { userPermissions } = useAuthState()

  return required && !isPermittedUser(userPermissions, { required }) ? <NotFound /> : page
}

const Pages = ({ countryId, countryAbbreviation, hasToAcceptLicenseId, isLoggedOut }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { userPermissions } = useAuthState()

  useEffect(() => window.scrollTo(0, 0), [location.pathname])

  const props = {
    countryId,
    countryAbbreviation,
    hasToAcceptLicenseId,
    isLoggedOut,
    permissions: userPermissions,
    location,
    navigate,
  }

  if (isLoggedOut || hasToAcceptLicenseId) {
    return (
      <SignedOutLayout>
        <RoutesPermissionProvider>
          <Routes>
            <Route path="/login" element={<LoadableLogin />} />
            <Route path="/reset-password" element={<ResetPassword {...props} />} />
            <Route path="/license" element={<License />} />
            <Route path="*" element={<Navigate replace to="/login" state={{ referrer: location }} />} />
          </Routes>
        </RoutesPermissionProvider>
      </SignedOutLayout>
    )
  }

  const destination = isPermittedUser(userPermissions, { required: ['dashboard:summary'] })
    ? '/dashboard'
    : isPermittedUser(userPermissions, { required: ['operationalData'] })
    ? '/operational-data'
    : '/welcome'

  const browseDestination = head(reduceNavLinks(navigations, userPermissions)).value || '/browse/device'

  return (
    <LoggedInLayout>
      <RoutesPermissionProvider>
        <Routes>
          <Route path="/" element={<Navigate replace to={destination} state={{ referrer: location }} />} />
          <Route path="/login" element={<Navigate replace to={destination} state={{ referrer: location }} />} />
          <Route path="/dashboard" element={<Auth required={['dashboard:summary']} page={<LoadableStatus />} />} />
          <Route path="/task-list" element={<Auth required={['task']} page={<TaskList {...props} />} />} />
          <Route path="/task-list/aggre-list" element={<Auth required={['task']} page={<TaskAggre {...props} />} />} />
          <Route path="/task-list/:taskId" element={<Auth required={['task']} page={<TaskDetail {...props} />} />} />
          <Route
            path="/operational-data/*"
            element={<Auth required={['operationalData']} page={<OperationalData {...props} />} />}
          />
          <Route
            path="/account-details/current/*"
            element={<Auth required={['account']} page={<AccountDetails {...props} />} />}
          />
          <Route path="/reports" element={<Auth required={['report']} page={<ReportIndex {...props} />} />} />
          <Route path="/browse" element={<Auth required={['browse']} page={<Navigate to={browseDestination} />} />} />
          <Route
            path="/browse/device"
            element={<Auth required={['browse', 'device']} page={<DeviceContainer {...props} />} />}
          />
          <Route
            path="/browse/device/:deviceId/*"
            element={<Auth required={['browse', 'device']} page={<DeviceDetail {...props} />} />}
          />
          <Route
            path="/browse/case/:caseId"
            element={<Auth required={['browse', 'case:edit']} page={<CaseDetails {...props} />} />}
          />
          <Route path="/browse/case" element={<Auth required={['browse', 'case']} page={<CaseList {...props} />} />} />
          <Route
            path="/browse/patient/:patientId"
            element={<Auth required={['browse', 'patient:edit']} page={<ClinicalHistory {...props} />} />}
          />
          <Route
            path="/browse/deviceApiKey"
            element={<Auth required={['browse', 'deviceApiKey']} page={<DeviceApiKeyList {...props} />} />}
          />
          <Route
            path="/browse/router"
            element={<Auth required={['browse', 'router']} page={<RouterList {...props} />} />}
          />
          <Route
            path="/browse/router/:routerId"
            element={<Auth required={['browse', 'router']} page={<RouterDetail {...props} />} />}
          />
          <Route
            path="/browse/reporter"
            element={<Auth required={['browse', 'reporter']} page={<ReporterList {...props} />} />}
          />
          <Route
            path="/browse/result"
            element={<Auth required={['browse', 'result']} page={<ResultList {...props} />} />}
          />
          <Route
            path="/browse/result/:resultId/*"
            element={<Auth required={['browse', 'result:edit']} page={<ResultDetail {...props} />} />}
          />
          <Route path="/browse/site" element={<Auth required={['browse', 'site']} page={<SiteList {...props} />} />} />
          <Route
            path="/browse/site/create"
            element={<Auth required={['browse', 'site']} page={<EditSite {...props} />} />}
          />
          <Route
            path="/browse/site/:siteId/*"
            element={<Auth required={['browse', 'site']} page={<SiteDetail {...props} />} />}
          />
          <Route
            path="/browse/person"
            element={<Auth required={['browse', 'person']} page={<PersonList {...props} />} />}
          />
          <Route
            path="/browse/person/:personId/*"
            element={<Auth required={['browse', 'person:edit']} page={<PersonDetail {...props} />} />}
          />
          <Route
            path="/browse/inventory/*"
            element={<Auth required={['browse', 'inventory']} page={<InventoryContainer {...props} />} />}
          />
          <Route
            path="/browse/notification"
            element={<Auth required={['browse', 'notification']} page={<NotificationList {...props} />} />}
          />
          <Route
            path="/browse/notification/:notificationId"
            element={<Auth required={['browse', 'notification:edit']} page={<NotificationDetail {...props} />} />}
          />
          <Route
            path="/browse/notification/:notificationId/history"
            element={<Auth required={['browse', 'notification']} page={<NotificationDetailHistory {...props} />} />}
          />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/browse/report" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RoutesPermissionProvider>
    </LoggedInLayout>
  )
}

export default Pages

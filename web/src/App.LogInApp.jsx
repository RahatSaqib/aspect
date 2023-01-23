import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useDispatch } from 'react-redux'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import IdleDialog from './components/IdleDialog'
import Loading from './components/Loading'
import config from './config'
import useHashAndScroll from './hooks/useHashAndScroll'
import LoggedInLayout from './oldComponents/LoggedInLayout'
import { isPermittedUser } from './oldComponents/shared/requirePermissions'
import CaseList from './oldPages/case/list/CaseList'
import OperationalData from './oldPages/dashboard/operational/OperationalData'
import DeviceApiKeyList from './oldPages/deviceApiKey/list/DeviceApiKeyList'
import InventoryContainer from './oldPages/inventory/InventoryContainer'
import PersonList from './oldPages/person/list/PersonList'
import ReportIndex from './oldPages/report/page/ReportIndex'
import ReporterList from './oldPages/reporter/list/ReporterList'
import ResultList from './oldPages/result/list/ResultList'
import RouterDetail from './oldPages/router/detail/RouterDetail'
import RouterList from './oldPages/router/list/RouterList'
import ContactPage from './pages/Contact'
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
import { idleLogout, refreshStart } from './store/AuthRedux'

const LoadableStatus = lazy(() => import('./oldPages/dashboard/status/Status'))

const LogInApp = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  useHashAndScroll()

  const [showIdleDialog, setShowIdleDialog] = useState(false)
  const { countryId, countryAbbreviation, hasToAcceptLicenseId, isLoggedOut, loggedOutReason, userPermissions } =
    useAuthState()

  useEffect(() => window.scrollTo(0, 0), [location.pathname])

  useEffect(() => {
    // Refresh the access token every 30 minutes.
    const refreshToken = setInterval(dispatch(refreshStart()), 30 * 60 * 1000)
    return () => clearInterval(refreshToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { reset } = useIdleTimer({
    timeout: config.userInactiveMinutes * 60 * 1000, // after minutes, user is idle
    promptTimeout: 60 * 1000, // after one minute, we call onIdle() and log user out
    stopOnIdle: true, // once user is logged out, we stop timers
    // Fire a Modal Prompt
    onPrompt: () => setShowIdleDialog(true),
    // Close Modal Prompt & log out your user
    onIdle: () => {
      setShowIdleDialog(false)
      dispatch(idleLogout())
    },
    // Close Modal Prompt & Do some active action (reset timer)
    onAction: () => {
      setShowIdleDialog(false)
      reset() // user is logged in so we reset all timers
    },
  })

  const props = {
    countryId,
    countryAbbreviation,
    hasToAcceptLicenseId,
    isLoggedOut,
    loggedOutReason,
    permissions: userPermissions,
    location,
    navigate,
  }

  const a = r => isPermittedUser(userPermissions, { required: r })

  return (
    <LoggedInLayout>
      <Suspense fallback={<Loading />}>
        <Routes>
          {a(['dashboard:summary']) ? (
            <>
              <Route path="/" element={<Navigate replace to="/dashboard" state={{ referrer: location }} />} />
              <Route path="/dashboard" element={<LoadableStatus />} />
            </>
          ) : null}
          {a(['operationalData']) ? (
            <>
              <Route path="/" element={<Navigate replace to="/operational-data" state={{ referrer: location }} />} />
              <Route path="/operational-data" element={<OperationalData />} />
            </>
          ) : null}
          {a(['account']) ? <Route path="/account-details/current/*" element={<ContactPage />} /> : null}
          {a(['report']) ? <Route path="/reports" element={<ReportIndex />} /> : null}

          {a(['browse', 'device']) ? (
            <>
              <Route path="/browse/device" element={<DeviceContainer />} />
              <Route path="/browse/device/:deviceId/*" element={<DeviceDetail {...props} />} />
            </>
          ) : null}

          {a(['browse', 'case']) ? <Route path="/browse/case" element={<CaseList {...props} />} /> : null}

          {a(['browse', 'deviceApiKey']) ? (
            <Route path="/browse/deviceApiKey" element={<DeviceApiKeyList {...props} />} />
          ) : null}

          {a(['browse', 'router']) ? (
            <>
              <Route path="/browse/router" element={<RouterList {...props} />} />
              <Route path="/browse/router/:routerId" element={<RouterDetail {...props} />} />
            </>
          ) : null}

          {a(['browse', 'reporter']) ? <Route path="/browse/reporter" element={<ReporterList />} /> : null}

          {a(['browse', 'result']) ? <Route path="/browse/result" element={<ResultList />} /> : null}
          {a(['browse', 'result:edit']) ? <Route path="/browse/result/:resultId/*" element={<ResultDetail />} /> : null}

          {a(['browse', 'site']) ? (
            <>
              <Route path="/browse/site" element={<SiteList {...props} />} />
              <Route path="/browse/site/create" element={<EditSite />} />
              <Route path="/browse/site/:siteId/*" element={<SiteDetail {...props} />} />
            </>
          ) : null}

          {a(['browse', 'person']) ? <Route path="/browse/person" element={<PersonList {...props} />} /> : null}
          {a(['browse', 'person:edit']) ? <Route path="/browse/person/:personId/*" element={<ContactPage />} /> : null}

          {a(['browse', 'inventory']) ? <Route path="/browse/inventory/*" element={<InventoryContainer />} /> : null}
          {a(['browse', 'notification']) ? (
            <>
              <Route path="/browse/notification" element={<NotificationList />} />
              <Route path="/browse/notification/:notificationId" element={<NotificationDetail />} />
              <Route path="/browse/notification/:notificationId/history" element={<NotificationDetailHistory />} />
            </>
          ) : null}

          <Route path="/" element={<Navigate replace to="/welcome" state={{ referrer: location }} />} />
          <Route path="/login" element={<Navigate replace to={{ pathname: '/' }} />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {showIdleDialog ? <IdleDialog /> : null}
    </LoggedInLayout>
  )
}

export default LogInApp

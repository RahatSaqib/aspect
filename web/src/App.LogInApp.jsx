import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useDispatch } from 'react-redux'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import IdleDialog from './components/IdleDialog'
import Loading from './components/Loading'
import LoggedInLayout from './components/LoggedInLayout'
import config from './config'
import useHashAndScroll from './hooks/useHashAndScroll'
import { isPermittedUser } from './oldComponents/shared/requirePermissions'
import { useAuthState } from './providers/AuthProvider'
import { fetchAssays } from './store/AssayRedux'
import { idleLogout, refreshStart } from './store/AuthRedux'
import { fetchCountries } from './store/GeographyRedux'

const CaseList = lazy(() => import('./oldPages/case/list/CaseList'))
const ContactPage = lazy(() => import('./pages/Contact'))
const DeviceApiKeyList = lazy(() => import('./oldPages/deviceApiKey/list/DeviceApiKeyList'))

const Devices = lazy(() => import('./pages/Devices/Status/DeviceList'))
const DevicesWorkload = lazy(() => import('./pages/Devices/Workload'))
const DeviceDetail = lazy(() => import('./pages/Devices/Detail/DeviceDetail'))
const EditSite = lazy(() => import('./pages/Site/Detail/Edit'))
const InventoryContainer = lazy(() => import('./oldPages/inventory/InventoryContainer'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))
const NotificationDetail = lazy(() => import('./pages/Notification/NotificationFormPage'))
const NotificationDetailHistory = lazy(() => import('./pages/Notification/NotificationHistoryPage'))
const NotificationList = lazy(() => import('./pages/Notification/NotificationListPage'))
const OperationalData = lazy(() => import('./oldPages/dashboard/operational/OperationalData'))
const PersonList = lazy(() => import('./oldPages/person/list/PersonList'))
const PkDashboard = lazy(() => import('./pages/PkDashboard'))
const ReporterList = lazy(() => import('./oldPages/reporter/list/ReporterList'))
const ReportIndex = lazy(() => import('./oldPages/report/page/ReportIndex'))
const ResultDetail = lazy(() => import('./pages/Results/Detail'))
const ResultList = lazy(() => import('./oldPages/result/list/ResultList'))
const RouterDetail = lazy(() => import('./oldPages/router/detail/RouterDetail'))
const RouterList = lazy(() => import('./oldPages/router/list/RouterList'))
const SiteDetail = lazy(() => import('./pages/Site/Detail'))
const SiteList = lazy(() => import('./pages/Site/List'))
const Status = lazy(() => import('./oldPages/dashboard/status/Status'))
const Welcome = lazy(() => import('./pages/Welcome'))
//

const DeviceCoverage = lazy(() => import('./pages/PkDashboard/pages/CoverageSection/DeviceCoveragePage'))
const ErrorRate = lazy(() => import('./pages/PkDashboard/pages/CoverageSection/ErrorRatePage'))
const Utilization = lazy(() => import('./pages/PkDashboard/pages/CoverageSection/UtilizationPage'))
const InventoryOverview = lazy(() => import('./pages/PkDashboard/pages/InventorySection/InventoryOverviewPage'))
const CurrentDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/CurrentDiagnosisPage'))
const CurrentRRTBDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/CurrentRRTBDiagnosisPage'))

const CurrentTesting = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/CurrentTestingPage'))
const NationalTestingTrends = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/NationalTestingTrendsPage'))
const CurrentXDRTesting = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/CurrentXDRTestingPage'))
const CovidGraphPage = lazy(() => import('./pages/PkDashboard/pages/OtherSection/CovidPage'))
const HivGraphPage = lazy(() => import('./pages/PkDashboard/pages/OtherSection/HivPage'))

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
    // fetch countries on start so we have them ready for all if (countries.lenght === 1) { ... } logic
    dispatch(fetchCountries())
    // fetch countries on start so we have them ready for filters logic
    dispatch(fetchAssays())

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

  const isPakistan = countryAbbreviation === 'US'

  return (
    <LoggedInLayout>
      <Suspense fallback={<Loading centered />}>
        <Routes>
          {a(['dashboard:summary']) ? (
            <>
              <Route path="/" element={<Navigate replace to="/dashboard" state={{ referrer: location }} />} />
              <Route path="/dashboard" element={isPakistan ? <PkDashboard /> : <Status />} />
              {isPakistan ? (
                <>
                  <Route path="/dashboard/coverage/device" element={<DeviceCoverage />} />
                  <Route path="/dashboard/coverage/error-rate" element={<ErrorRate />} />
                  <Route path="/dashboard/coverage/utilization" element={<Utilization />} />
                  <Route path="/dashboard/inventory/overview" element={<InventoryOverview />} />
                  <Route path="/dashboard/rif/current-testing" element={<CurrentTesting />} />
                  <Route path="/dashboard/rif/national-testing-trends" element={<NationalTestingTrends />} />
                  <Route path="/dashboard/rif/current-diagnosis" element={<CurrentDiagnosis />} />
                  <Route path="/dashboard/rif/current-rrtb-diagnosis" element={<CurrentRRTBDiagnosis />} />

                  <Route path="/dashboard/xdr/current-testing" element={<CurrentXDRTesting />} />

                  <Route path="/dashboard/other/covid" element={<CovidGraphPage />} />
                  <Route path="/dashboard/other/hiv" element={<HivGraphPage />} />
                </>
              ) : null}
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
              <Route path="/browse/device/list" element={<Devices />} />
              <Route path="/browse/device/list/:deviceId/*" element={<DeviceDetail {...props} />} />
              <Route path="/browse/device/workload" element={<DevicesWorkload />} />
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
          <Route path="/license" element={<Navigate replace to={{ pathname: '/' }} />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {showIdleDialog ? <IdleDialog /> : null}
    </LoggedInLayout>
  )
}

export default LogInApp

import React, { lazy, Suspense, useEffect, useState } from 'react'
import { IdleTimerProvider } from 'react-idle-timer'
import { useIntl } from 'react-intl'
import { useDispatch } from 'react-redux'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Loading, ErrorBoundary, LoggedInLayout } from './components'
import config from './config'
import useAuthState from './hooks/useAuthState'
import useHashAndScroll from './hooks/useHashAndScroll'
import messages from './messages/allMessages'
import AspectDialog from './components/shared/AspectDialog'
import { isPermittedUser } from './components/shared/requirePermissions'
import RecordPageViewProvider from './providers/RecordPageViewProvider'
import { routePaths } from './routes/constants'
import { idleLogout, refreshStart } from './store/AuthRedux'
import { fetchCountries } from './store/GeographyRedux'

const ContactPage = lazy(() => import('./pages/Contact'))
const DeviceApiKeyList = lazy(() => import('./oldPages/deviceApiKey/list/DeviceApiKeyList'))

const Devices = lazy(() => import('./pages/Devices/Status/DeviceList'))
const DevicesWorkload = lazy(() => import('./pages/Devices/Workload'))
const DeviceDetail = lazy(() => import('./pages/Devices/Detail/DeviceDetail'))
const EditSite = lazy(() => import('./pages/Site/Detail/Edit'))
const InventoryItemsList = lazy(() => import('./oldPages/inventory/list/InventoryItemsList'))
const InventoryReconciliation = lazy(() => import('./pages/Inventory/Reconciliation'))
const InventoryLog = lazy(() => import('./oldPages/inventory/log/InventoryLog'))
const InventoryTransfers = lazy(() => import('./pages/Inventory/Transfers'))
const InventoryList = lazy(() => import('./pages/Inventory/InventoryList'))
const InventoryReconciliationForm = lazy(() =>
  import('./pages/Inventory/InventoryDetails/InventoryForm/InventoryReconciliationForm')
)
const InventoryDetails = lazy(() => import('./pages/Inventory/InventoryDetails'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))
const NotificationDetail = lazy(() => import('./pages/Notification/NotificationFormPage'))
const NotificationList = lazy(() => import('./pages/Notification/NotificationListPage'))
const NotificationLogs = lazy(() => import('./pages/Notification/NotificationLogsPage'))
const OperationalData = lazy(() => import('./oldPages/dashboard/operational/OperationalData'))
const PersonList = lazy(() => import('./pages/Person/List/PersonList'))
const PkDashboard = lazy(() => import('./pages/PkDashboard'))
const ReporterList = lazy(() => import('./oldPages/reporter/list/ReporterList'))
const ReportIndex = lazy(() => import('./pages/Reports/ReportIndex'))
const SampleList = lazy(() => import('./pages/Sample/SampleList'))
const ResultDetail = lazy(() => import('./pages/Results/Detail'))
const ResultList = lazy(() => import('./oldPages/result/list/ResultList'))
const TruenatCustomFieldsList = lazy(() => import('./pages/Forms/TruenatCustomFields'))
const TruenatCustomFieldsDetail = lazy(() => import('./pages/Forms/TruenatCustomFields/Detail'))
const SiteDetail = lazy(() => import('./pages/Site/Detail'))
const SiteList = lazy(() => import('./pages/Site/List'))
const Status = lazy(() => import('./oldPages/dashboard/status/Status'))
const Welcome = lazy(() => import('./pages/Welcome'))
const AdminLgas = lazy(() => import('./pages/Admin/Lgas/LgasPage'))
const AdminStates = lazy(() => import('./pages/Admin/States/StatesPage'))
//

const DeviceCoverage = lazy(() => import('./pages/PkDashboard/pages/CoverageSection/DeviceCoveragePage'))
const ErrorRate = lazy(() => import('./pages/PkDashboard/pages/CoverageSection/ErrorRatePage'))
const Utilization = lazy(() => import('./pages/PkDashboard/pages/CoverageSection/UtilizationPage'))
const InventoryOverview = lazy(() => import('./pages/PkDashboard/pages/InventorySection/InventoryOverviewPage'))
const CovidGraphPage = lazy(() => import('./pages/PkDashboard/pages/OtherSection/CovidPage'))
const HivGraphPage = lazy(() => import('./pages/PkDashboard/pages/OtherSection/HivPage'))

const CurrentDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/CurrentDiagnosisPage'))
const CurrentRRTBDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/CurrentRRTBDiagnosisPage'))
const TestDiagTrend = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/TestDiagTrendPage'))
const RrtbTestDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/RrtbTestDiagnosisPage'))
const CurrentTesting = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/CurrentTestingPage'))
const NationalDiagnosisRif = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/NationalDiagnosisPage'))
const NationalDiagnosisXdr = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/NationalDiagnosisPage'))
const NationalRtbTrends = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/NationalRtbTrendsPage'))
const NationalTestingTrends = lazy(() => import('./pages/PkDashboard/pages/MtbRifSection/NationalTestingTrendsPage'))
const ProvincialRIFTestingTrend = lazy(() =>
  import('./pages/PkDashboard/pages/MtbRifSection/ProvincialTestingTrendPage')
)
const ProvincialRIFDiagnosisTrend = lazy(() =>
  import('./pages/PkDashboard/pages/MtbRifSection/ProvincialDiagnosisTrendPage')
)
const ProvincialRIFTestingTrendRRTB = lazy(() =>
  import('./pages/PkDashboard/pages/MtbRifSection/ProvincialRRTBDiagnosisTrendPage')
)

const XDRByDevice = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/XDRByDevice'))
const NationalGXTestingTrends = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/NationalTestingTrendsPage'))
const NationalFQTrends = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/NationalFQTrendPage'))
const CurrentXDRTesting = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/CurrentXDRTestingPage'))
const CurrentXDRDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/CurrentXDRDiagnosisPage'))
const CurrentFQTrend = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/CurrentFQTrendPage'))
const GXTestingAndDiagnosis = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/GXTestingAndDiagnosisPage'))
const DataVisualisationForXDRResistance = lazy(() =>
  import('./pages/PkDashboard/pages/MtbXdrSection/DataVisualisationForXDRResistance')
)
const ProvincialXDRTestingTrend = lazy(() =>
  import('./pages/PkDashboard/pages/MtbXdrSection/ProvincialTestingTrendPage')
)
const ProvincialXDRDiagnosisTrend = lazy(() =>
  import('./pages/PkDashboard/pages/MtbXdrSection/ProvincialDiagnosisTrendPage')
)
const ProvincialXDRTrendsFQ = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/ProvincialXDRTrendsFQPage'))
const XDRTestingDiagnosisTrend = lazy(() => import('./pages/PkDashboard/pages/MtbXdrSection/XDRTestingDiagnosisTrend'))

const LogInApp = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useIntl()

  useHashAndScroll()

  const [showIdleDialog, setShowIdleDialog] = useState(false)
  const { countryId, countryAbbreviation, hasToAcceptLicenseId, isLoggedOut, loggedOutReason, userPermissions } =
    useAuthState()

  useEffect(() => window.scrollTo(0, 0), [location.pathname])

  useEffect(() => {
    // fetch countries on start so we have them ready for all if (countries.lenght === 1) { ... } logic
    dispatch(fetchCountries())

    // Refresh the access token every 30 minutes.
    const refreshToken = setInterval(() => dispatch(refreshStart()), 30 * 60 * 1000)
    return () => clearInterval(refreshToken)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const idleTimerConfig = {
    timeout: config.userInactiveMinutes * 60 * 1000, // after minutes, user is idle
    promptTimeout: 60 * 1000, // after one minute, we call onIdle() and log user out
    stopOnIdle: true, // once user is logged out, we stop timers
    crossTab: true,
    // Fire a Modal Prompt
    onPrompt: () => setShowIdleDialog(true),
    // Close Modal Prompt & log out your user
    onIdle: () => {
      setShowIdleDialog(false)
      dispatch(idleLogout())
    },
    // Close Modal Prompt & Do some active action (reset timer)
    onAction: (event, { reset }) => {
      setShowIdleDialog(false)
      reset() // user is logged in so we reset all timers
    },
  }

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
    <IdleTimerProvider {...idleTimerConfig}>
      <LoggedInLayout>
        <RecordPageViewProvider>
          <ErrorBoundary>
            <Suspense fallback={<Loading centered />}>
              <Routes>
                {a(['dashboard:summary']) ? (
                  <>
                    <Route path="/" element={<Navigate replace to="/dashboard" state={{ referrer: location }} />} />
                    <Route path="/dashboard" element={<Status />} />
                    <Route path="/dashboard-v2" element={<PkDashboard />} />
                    <Route path="/dashboard/rif/current-testing" element={<CurrentTesting />} />
                    <Route path="/dashboard/rif/national-diagnosis" element={<NationalDiagnosisRif />} />
                    <Route path="/dashboard/rif/national-rtb-trends" element={<NationalRtbTrends />} />
                    <Route path="/dashboard/rif/national-testing-trend" element={<NationalTestingTrends />} />
                    <Route path="/dashboard/rif/current-diagnosis" element={<CurrentDiagnosis />} />
                    <Route path="/dashboard/rif/current-rrtb-diagnosis" element={<CurrentRRTBDiagnosis />} />
                    <Route path="/dashboard/rif/test-diag-trend" element={<TestDiagTrend />} />
                    <Route path="/dashboard/rif/provincial-testing-trend" element={<ProvincialRIFTestingTrend />} />
                    <Route path="/dashboard/rif/provincial-diagnosis-trend" element={<ProvincialRIFDiagnosisTrend />} />
                    <Route
                      path="/dashboard/rif/provincial-rrtb-trend-comparison"
                      element={<ProvincialRIFTestingTrendRRTB />}
                    />
                    <Route path="/dashboard/rif/rrtb-test-diagnosis" element={<RrtbTestDiagnosis />} />

                    <Route path="/dashboard/xdr/by-device" element={<XDRByDevice />} />
                    <Route path="/dashboard/xdr/national-testing-trend" element={<NationalGXTestingTrends />} />
                    <Route path="/dashboard/xdr/national-diagnosis" element={<NationalDiagnosisXdr />} />
                    <Route path="/dashboard/xdr/national-fq" element={<NationalFQTrends />} />
                    <Route path="/dashboard/xdr/current-testing" element={<CurrentXDRTesting />} />
                    <Route path="/dashboard/xdr/current-diagnosis" element={<CurrentXDRDiagnosis />} />
                    <Route path="/dashboard/xdr/gx-testing-and-diagnosis" element={<GXTestingAndDiagnosis />} />
                    <Route
                      path="/dashboard/xdr/data-visualisation-for-xdr-resistance"
                      element={<DataVisualisationForXDRResistance />}
                    />
                    <Route path="/dashboard/xdr/provincial-testing-trend" element={<ProvincialXDRTestingTrend />} />
                    <Route path="/dashboard/xdr/provincial-diagnosis-trend" element={<ProvincialXDRDiagnosisTrend />} />
                    <Route path="/dashboard/xdr/provincial-fq-diagnosis-trend" element={<ProvincialXDRTrendsFQ />} />
                    <Route path="/dashboard/xdr/testing-diagnosis-trend" element={<XDRTestingDiagnosisTrend />} />
                    <Route path="/dashboard/xdr/current-fq-detection" element={<CurrentFQTrend />} />

                    <Route path="/dashboard/coverage/device" element={<DeviceCoverage />} />
                    <Route path="/dashboard/coverage/utilization" element={<Utilization />} />
                    <Route path="/dashboard/coverage/error-rate" element={<ErrorRate />} />
                    <Route path="/dashboard/inventory/overview" element={<InventoryOverview />} />
                    <Route path="/dashboard/other/covid" element={<CovidGraphPage />} />
                    <Route path="/dashboard/other/hiv" element={<HivGraphPage />} />
                  </>
                ) : null}
                {a(['operationalData']) ? (
                  <>
                    <Route
                      path="/"
                      element={<Navigate replace to="/operational-data" state={{ referrer: location }} />}
                    />
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

                {a(['browse', 'deviceApiKey']) ? (
                  <Route path="/browse/deviceApiKey" element={<DeviceApiKeyList />} />
                ) : null}

                {a(['browse', 'reporter']) ? <Route path="/browse/reporter" element={<ReporterList />} /> : null}

                {a(['browse', 'reporter']) ? <Route path="/browse/samples" element={<SampleList />} /> : null}

                {a(['browse', 'result']) ? <Route path="/browse/result" element={<ResultList />} /> : null}
                {a(['browse', 'forms', 'result']) ? (
                  <>
                    <Route path={routePaths.FORMS_TRUENAT_CUSTOM_FIELDS} element={<TruenatCustomFieldsList />} />
                    <Route
                      path={routePaths.FORMS_TRUENAT_CUSTOM_FIELDS_DETAIL}
                      element={<TruenatCustomFieldsDetail />}
                    />
                  </>
                ) : null}
                {a(['browse', 'result:edit']) ? (
                  <Route path={routePaths.RESULT_DETAILS} element={<ResultDetail />} />
                ) : null}

                {a(['browse', 'site']) ? (
                  <>
                    <Route path="/browse/site" element={<SiteList {...props} />} />
                    <Route path="/browse/site/create" element={<EditSite />} />
                    <Route path="/browse/site/:siteId/*" element={<SiteDetail {...props} />} />
                  </>
                ) : null}

                {a(['browse', 'person']) ? <Route path="/browse/person" element={<PersonList />} /> : null}
                {a(['browse', 'person:edit']) ? (
                  <Route path="/browse/person/:personId/*" element={<ContactPage />} />
                ) : null}

                {a(['browse', 'inventory']) ? (
                  <>
                    <Route path={routePaths.INVENTORY_SUPPLIES} element={<InventoryItemsList />} />
                    <Route path={routePaths.INVENTORY_LOG} element={<InventoryLog />} />
                    <Route path={routePaths.INVENTORY_TRANSFERS} element={<InventoryTransfers />} />
                    <Route path={routePaths.INVENTORY_OVERVIEW} element={<InventoryOverview />} />
                    {/** The below path is deprecated, but keeping it here for now to avoid breaking changes. It will be removed in the upcoming releases. */}
                    <Route path={routePaths.INVENTORY_RECONCILIATION_FORM} element={<InventoryReconciliationForm />} />
                    <Route path={routePaths.INVENTORY_RECONCILIATION} element={<InventoryReconciliation />} />
                  </>
                ) : null}
                {a(['browse', 'notification']) ? (
                  <>
                    <Route path="/browse/notification/types" element={<NotificationList />} />
                    <Route path="/browse/notification/logs" element={<NotificationLogs />} />
                    <Route path="/browse/notification/:notificationId" element={<NotificationDetail />} />
                  </>
                ) : null}
                {a(['admin:edit']) ? (
                  <>
                    <Route path="/browse/admin/states" element={<AdminStates />} />
                    <Route path="/browse/admin/lgas" element={<AdminLgas />} />
                    <Route path="/browse/admin/inventory-list" element={<InventoryList />} />
                    <Route path="/browse/admin/inventory-list/:cartridgeId/*" element={<InventoryDetails />} />
                    <Route
                      path={routePaths.ADMIN_INVENTORY_RECONCILIATION_FORM}
                      element={<InventoryReconciliationForm />}
                    />
                  </>
                ) : null}

                <Route path="/" element={<Navigate replace to="/welcome" state={{ referrer: location }} />} />
                <Route path="/login" element={<Navigate replace to={{ pathname: '/' }} />} />
                <Route path="/license" element={<Navigate replace to={{ pathname: '/' }} />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>

          {showIdleDialog ? (
            <AspectDialog title={formatMessage(messages.idleDialogTitle)} modal open>
              <span>{formatMessage(messages.idleDialogHelp)}</span>
            </AspectDialog>
          ) : null}
        </RecordPageViewProvider>
      </LoggedInLayout>
    </IdleTimerProvider>
  )
}

export default LogInApp

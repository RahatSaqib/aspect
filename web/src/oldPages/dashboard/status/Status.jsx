import React, { useEffect, useMemo } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import ErrorBoundary from '../../../components/ErrorBoundary'
import useI18n from '../../../hooks/useI18n'
import BrowseSiteDropdown from '../../../oldComponents/BrowseSiteDropdown'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import { fetchAssays } from '../../../store/AssayRedux'
import CovidResultGraph from '../Graphs/CovidResultGraph/CovidResultGraph'
import DeviceStatusGraph from '../Graphs/DeviceStatusGraph'
import HivResultsGraph from '../Graphs/HivResultsGraph'
import InventoryStatusGraph from '../Graphs/InventoryStatusGraph'
import QuartersMtbDetectedGraph from '../Graphs/QuartersMtbDetectedGraph'
import QuartersRifDetectedGraph from '../Graphs/QuartersRifDetectedGraph'
import TbDetectedGraph from '../Graphs/TbDetectedGraph'
import TbResultsGraph from '../Graphs/TbResultsGraph'
import TestsOverTimeGraph from '../Graphs/TestsOverTimeGraph'
import TreatmentStatusGraph from '../Graphs/TreatmentStatusGraph'
import TrendInYearsAllTestsGraph from '../Graphs/TrendInYearsAllTestsGraph'
import TrendInYearsMtbDetectedGraph from '../Graphs/TrendInYearsMtbDetectedGraph'
import TrendInYearsRifDetectedGraph from '../Graphs/TrendInYearsRifDetectedGraph'
import XDRFLQResistanceGraph from '../Graphs/XDRFLQResistanceGraph'
import XDRResultsGraph from '../Graphs/XDRResultsGraph'
import styles from './index.css'
import messages from './messages'
import Reports from './Reports'
import SummaryStatus from './SummaryStatus'

const cssClasses = classnames.bind(styles)

const Status = () => {
  const location = useLocation()
  const { formatMessage } = useI18n()
  const dispatch = useDispatch()

  const assaysComposed = useSelector(({ assay }) => assay.items)
  const assays = useMemo(() => assaysComposed.toJS().filter(a => a.hasResults), [assaysComposed])

  useEffect(() => {
    dispatch(fetchAssays(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allowed = options =>
    assays.filter(({ externalId, hasResults }) => options.includes(externalId) && hasResults).map(e => e.externalId)

  const tbPermissions = allowed(['GxMtbRif', 'GxMtbRifUltra'])
  const xdrPermissions = allowed(['GxMtbXdr'])
  const hivPermissions = allowed([
    'abbottM2000DBSHivVL',
    'abbottM2000PlasmaHivVL',
    'assayAlereQHiv12Detect',
    'assayAlereQHiv12VLPlasma',
    'assayCobasHivVl',
    'GxHiv1Vl',
    'QHivVL',
    'ReporterHivVL',
  ])
  const covidPermissions = allowed(['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19'])

  return (
    <div className={cssClasses('Container')} style={{ marginBottom: 0 }}>
      <Helmet title={formatMessage(messages.statusTitle)} />
      <div className={cssClasses('FiltersGroup')}>
        <BrowseSiteDropdown location={location} />
      </div>
      <ErrorBoundary>
        <PermissionsProvider permissions={['dashboard']}>
          <SummaryStatus className={cssClasses('Section--summary')} dashboard="home" />
        </PermissionsProvider>
      </ErrorBoundary>

      {assays ? (
        <>
          <PermissionsProvider permissions={['dashboard']}>
            <TestsOverTimeGraph assaysFromState={assays} /> {/* 1 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...tbPermissions]}>
            <TbDetectedGraph assaysFromState={assays} /> {/* 2 */}
            <TbResultsGraph assaysFromState={assays} /> {/* 3 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...xdrPermissions]}>
            <XDRResultsGraph assaysFromState={assays} /> {/* 4 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...tbPermissions]}>
            <TrendInYearsAllTestsGraph assaysFromState={assays} /> {/* 5 */}
            <TrendInYearsMtbDetectedGraph assaysFromState={assays} /> {/* 6 */}
            <TrendInYearsRifDetectedGraph assaysFromState={assays} /> {/* 7 */}
            <QuartersMtbDetectedGraph assaysFromState={assays} /> {/* 8 */}
            <QuartersRifDetectedGraph assaysFromState={assays} /> {/* 9 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...xdrPermissions]}>
            <XDRFLQResistanceGraph assaysFromState={assays} /> {/* 10 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...covidPermissions]}>
            <CovidResultGraph assaysFromState={assays} /> {/* 11 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...hivPermissions]}>
            <HivResultsGraph assaysFromState={assays} /> {/* 12 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', 'operationalData']}>
            <DeviceStatusGraph assaysFromState={assays} /> {/* 13 */}
            <InventoryStatusGraph assaysFromState={assays} /> {/* 14 */}
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', ...hivPermissions]}>
            <TreatmentStatusGraph assaysFromState={assays} /> {/* 15 */}
          </PermissionsProvider>
        </>
      ) : null}

      <Reports className={cssClasses('Section--withStatus')} title={formatMessage(messages.reportsTitle)} />
    </div>
  )
}

export default Status

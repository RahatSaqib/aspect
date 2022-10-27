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

  useEffect(() => {
    dispatch(fetchAssays(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const assays = useSelector(({ assay }) => assay.items).toJS()
  const tbPermissions = ['GxMtbRif', 'GxMtbRifUltra']
  const xdrPermissions = ['GxMtbXdr']
  const hivPermissions = [
    'abbottM2000DBSHivVL',
    'abbottM2000PlasmaHivVL',
    'assayAlereQHiv12Detect',
    'assayAlereQHiv12VLPlasma',
    'assayCobasHivVl',
    'GxHiv1Vl',
    'QHivVL',
    'ReporterHivVL',
  ]
  const covidPermissions = ['assayGXCovid19', 'assayMP96Covid19', 'assayQS7Covid19', 'assayGenericCovid19']

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

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <TbDetectedGraph assaysFromState={assays} /> {/* 2 */}
              <TbResultsGraph assaysFromState={assays} /> {/* 3 */}
            </PermissionsProvider>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <XDRResultsGraph assaysFromState={assays} /> {/* 4 */}
            </PermissionsProvider>
          ) : null}

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <TrendInYearsAllTestsGraph assaysFromState={assays} /> {/* 5 */}
              <TrendInYearsMtbDetectedGraph assaysFromState={assays} /> {/* 6 */}
              <TrendInYearsRifDetectedGraph assaysFromState={assays} /> {/* 7 */}
              <QuartersMtbDetectedGraph assaysFromState={assays} /> {/* 8 */}
              <QuartersRifDetectedGraph assaysFromState={assays} /> {/* 9 */}
            </PermissionsProvider>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <XDRFLQResistanceGraph assaysFromState={assays} /> {/* 10 */}
            </PermissionsProvider>
          ) : null}

          {assays.some(a => covidPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <CovidResultGraph assaysFromState={assays} /> {/* 11 */}
            </PermissionsProvider>
          ) : null}

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <HivResultsGraph assaysFromState={assays} /> {/* 12 */}
            </PermissionsProvider>
          ) : null}

          <PermissionsProvider permissions={['dashboard', 'operationalData']}>
            <DeviceStatusGraph assaysFromState={assays} /> {/* 13 */}
            <InventoryStatusGraph assaysFromState={assays} /> {/* 14 */}
          </PermissionsProvider>

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionsProvider permissions={['dashboard']}>
              <TreatmentStatusGraph assaysFromState={assays} /> {/* 15 */}
            </PermissionsProvider>
          ) : null}
        </>
      ) : null}

      <Reports className={cssClasses('Section--withStatus')} title={formatMessage(messages.reportsTitle)} />
    </div>
  )
}

export default Status

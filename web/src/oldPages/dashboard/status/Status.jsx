import React, { useEffect, useMemo } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useSelector, useDispatch } from 'react-redux'
import ErrorBoundary from '../../../cleanComponents/ErrorBoundary'
import PermissionChecker from '../../../components/PermissionChecker'
import useI18n from '../../../hooks/useI18n'
import { useAuthState } from '../../../providers/AuthProvider'
import { fetchAssays } from '../../../store/AssayRedux'
import CovidResultGraph from '../Graphs/CovidResultGraph'
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
  const { formatMessage } = useI18n()
  const dispatch = useDispatch()
  const { isCountry } = useAuthState()
  useEffect(() => {
    dispatch(fetchAssays(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const assaysImmutable = useSelector(({ assay }) => assay.items)
  const assays = useMemo(() => assaysImmutable.toJS(), [assaysImmutable])
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
    <div className={cssClasses('Container')}>
      <Helmet title={formatMessage(messages.statusTitle)} />
      <ErrorBoundary>
        <PermissionChecker permissions={['dashboard']}>
          <SummaryStatus className={cssClasses('Section--summary')} dashboard="home" />
        </PermissionChecker>
      </ErrorBoundary>

      {assays ? (
        <div className={cssClasses('wrapper')}>
          <PermissionChecker permissions={['dashboard']}>
            <TestsOverTimeGraph assaysFromState={assays} /> {/*  1  */}
          </PermissionChecker>

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <TbDetectedGraph assaysFromState={assays} /> {/* 2 */}
              <TbResultsGraph assaysFromState={assays} /> {/* 3 */}
            </PermissionChecker>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <XDRResultsGraph assaysFromState={assays} /> {/* 4 */}
            </PermissionChecker>
          ) : null}

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <TrendInYearsAllTestsGraph assaysFromState={assays} /> {/* 5 */}
              <TrendInYearsMtbDetectedGraph assaysFromState={assays} /> {/* 6 */}
              <TrendInYearsRifDetectedGraph assaysFromState={assays} /> {/* 7 */}
              <QuartersMtbDetectedGraph assaysFromState={assays} /> {/* 8 */}
              <QuartersRifDetectedGraph assaysFromState={assays} /> {/* 9 */}
            </PermissionChecker>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <XDRFLQResistanceGraph assaysFromState={assays} /> {/* 10 */}
            </PermissionChecker>
          ) : null}

          {assays.some(a => covidPermissions.includes(a.externalId)) && !isCountry('BD') ? (
            <PermissionChecker permissions={['dashboard']}>
              <CovidResultGraph assaysFromState={assays} /> {/* 11 */}
            </PermissionChecker>
          ) : null}

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <HivResultsGraph assaysFromState={assays} /> {/* 12 */}
            </PermissionChecker>
          ) : null}

          <PermissionChecker permissions={['dashboard', 'operationalData']}>
            {!isCountry('BD') && <DeviceStatusGraph assaysFromState={assays} />} {/* 13 */}
            <InventoryStatusGraph assaysFromState={assays} /> {/* 14 */}
          </PermissionChecker>

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard', '+reporter']}>
              <TreatmentStatusGraph assaysFromState={assays} /> {/* 15 */}
            </PermissionChecker>
          ) : null}
        </div>
      ) : null}

      <Reports className={cssClasses('Section--withStatus')} title={formatMessage(messages.reportsTitle)} />
    </div>
  )
}

export default Status

import React, { useEffect, useMemo } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useDispatch, useSelector } from 'react-redux'
import ErrorBoundary from '../../../cleanComponents/ErrorBoundary'
import CovidResultGraph from '../../../cleanComponents/Graphs/CovidResultGraph'
import HivResultsGraph from '../../../cleanComponents/Graphs/HivResultsGraph'
import QuartersMtbDetectedGraph from '../../../cleanComponents/Graphs/QuartersMtbDetectedGraph'
import QuartersRifDetectedGraph from '../../../cleanComponents/Graphs/QuartersRifDetectedGraph'
import TbDetectedGraph from '../../../cleanComponents/Graphs/TbDetectedGraph'
import TbResultsGraph from '../../../cleanComponents/Graphs/TbResultsGraph'
import TestsOverTimeGraph from '../../../cleanComponents/Graphs/TestsOverTimeGraph'
import TreatmentStatusGraph from '../../../cleanComponents/Graphs/TreatmentStatusGraph'
import TrendInYearsAllTestsGraph from '../../../cleanComponents/Graphs/TrendInYearsAllTestsGraph'
import TrendInYearsMtbDetectedGraph from '../../../cleanComponents/Graphs/TrendInYearsMtbDetectedGraph'
import TrendInYearsRifDetectedGraph from '../../../cleanComponents/Graphs/TrendInYearsRifDetectedGraph'
import XDRFLQResistanceGraph from '../../../cleanComponents/Graphs/XDRFLQResistanceGraph'
import XDRResultsGraph from '../../../cleanComponents/Graphs/XDRResultsGraph'
import PermissionChecker from '../../../components/PermissionChecker'
import useI18n from '../../../hooks/useI18n'
import { useAuthState } from '../../../providers/AuthProvider'
import { fetchAssays } from '../../../store/AssayRedux'
import DeviceStatusGraph from '../Graphs/DeviceStatusGraph'
import InventoryStatusGraph from '../Graphs/InventoryStatusGraph'
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

      <PermissionChecker permissions={['dashboard']}>
        <ErrorBoundary>
          <SummaryStatus className={cssClasses('Section--summary')} dashboard="home" />
        </ErrorBoundary>
      </PermissionChecker>

      {assays ? (
        <div className={cssClasses('wrapper')}>
          <PermissionChecker permissions={['dashboard']}>
            <ErrorBoundary>
              <TestsOverTimeGraph assaysFromState={assays} /> {/*  1  */}
            </ErrorBoundary>
          </PermissionChecker>

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <TbDetectedGraph assaysFromState={assays} /> {/* 2 */}
              </ErrorBoundary>
              <ErrorBoundary>
                <TbResultsGraph assaysFromState={assays} /> {/* 3 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <XDRResultsGraph assaysFromState={assays} /> {/* 4 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}

          {assays.some(a => tbPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <TrendInYearsAllTestsGraph /> {/* 5 */}
              </ErrorBoundary>
              <ErrorBoundary>
                <TrendInYearsMtbDetectedGraph /> {/* 6 */}
              </ErrorBoundary>
              <ErrorBoundary>
                <TrendInYearsRifDetectedGraph /> {/* 7 */}
              </ErrorBoundary>
              <ErrorBoundary>
                <QuartersMtbDetectedGraph /> {/* 8 */}
              </ErrorBoundary>
              <ErrorBoundary>
                <QuartersRifDetectedGraph /> {/* 9 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}

          {assays.some(a => xdrPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <XDRFLQResistanceGraph /> {/* 10 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}

          {assays.some(a => covidPermissions.includes(a.externalId)) && !isCountry('BD') ? (
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <CovidResultGraph assaysFromState={assays} /> {/* 11 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard']}>
              <ErrorBoundary>
                <HivResultsGraph assaysFromState={assays} /> {/* 12 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}

          <PermissionChecker permissions={['dashboard', 'operationalData']}>
            {!isCountry('BD') ? (
              <ErrorBoundary>
                <DeviceStatusGraph assaysFromState={assays} /> {/* 13 */}
              </ErrorBoundary>
            ) : null}
            <ErrorBoundary>
              <InventoryStatusGraph assaysFromState={assays} /> {/* 14 */}
            </ErrorBoundary>
          </PermissionChecker>

          {assays.some(a => hivPermissions.includes(a.externalId)) ? (
            <PermissionChecker permissions={['dashboard', '+reporter']}>
              <ErrorBoundary>
                <TreatmentStatusGraph assaysFromState={assays} /> {/* 15 */}
              </ErrorBoundary>
            </PermissionChecker>
          ) : null}
        </div>
      ) : null}

      <ErrorBoundary>
        <Reports className={cssClasses('Section--withStatus')} title={formatMessage(messages.reportsTitle)} />
      </ErrorBoundary>
    </div>
  )
}

export default Status

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
import CovidCasesByAgeAndGender from '../Graphs/CovidCasesByAgeAndGender'
import CovidDailyConfirmedGraph from '../Graphs/CovidDailyConfirmedGraph'
import CovidMortalityAndRecoveryByGenderGraph from '../Graphs/CovidMortalityAndRecoveryByGenderGraph'
import CovidMortalityAndRecoveryGraph from '../Graphs/CovidMortalityAndRecoveryGraph'
import DeviceStatusGraph from '../Graphs/DeviceStatusGraph'
import GroupedByTotalResultsGraphs from '../Graphs/Grouped/GroupedByTotalResultsGraphs'
import GroupedByTrendsInQuartersGraphs from '../Graphs/Grouped/GroupedByTrendsInQuartersGraphs'
import GroupedByTrendsInYearsGraphs from '../Graphs/Grouped/GroupedByTrendsInYearsGraphs'
import InventoryStatusGraph from '../Graphs/InventoryStatusGraph'
import TestsOverTimeGraph from '../Graphs/TestsOverTimeGraph'
import TreatmentStatusGraph from '../Graphs/TreatmentStatusGraph'
import XDRFLQResistanceGraph from '../Graphs/XDRFLQResistanceGraph'
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
          <PermissionsProvider permissions={['dashboard', '+result']}>
            <TestsOverTimeGraph assaysFromState={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', '+result']}>
            <GroupedByTotalResultsGraphs assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', '+reporter', '+treatmentStatus:view', '+result:view']}>
            <TreatmentStatusGraph assaysFromState={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', 'operationalData']}>
            <DeviceStatusGraph assaysFromState={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['covid']}>
            <CovidDailyConfirmedGraph assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['covid']}>
            <CovidMortalityAndRecoveryGraph assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['covid']}>
            <CovidMortalityAndRecoveryByGenderGraph assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['covid']}>
            <CovidCasesByAgeAndGender assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', 'operationalData']}>
            <InventoryStatusGraph assaysFromState={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', '+result']}>
            <GroupedByTrendsInYearsGraphs assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard', '+result']}>
            <GroupedByTrendsInQuartersGraphs assays={assays} />
          </PermissionsProvider>
          <PermissionsProvider permissions={['dashboard']}>
            <XDRFLQResistanceGraph assaysFromState={assays} />
          </PermissionsProvider>
        </>
      ) : null}

      <Reports className={cssClasses('Section--withStatus')} title={formatMessage(messages.reportsTitle)} />
    </div>
  )
}

export default Status

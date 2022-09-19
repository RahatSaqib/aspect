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
import messages from './messages'
import Reports from './Reports'
import styles from './Status.css'
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
          <TestsOverTimeGraph assaysFromState={assays} />
          <GroupedByTotalResultsGraphs assays={assays} />
          <TreatmentStatusGraph assaysFromState={assays} />
          <DeviceStatusGraph assays={assays} />
          <CovidDailyConfirmedGraph assays={assays} />
          <CovidMortalityAndRecoveryGraph assays={assays} />
          <CovidMortalityAndRecoveryByGenderGraph assays={assays} />
          <CovidCasesByAgeAndGender assays={assays} />
          <InventoryStatusGraph assays={assays} />
          <GroupedByTrendsInYearsGraphs assays={assays} />
          <GroupedByTrendsInQuartersGraphs assays={assays} />
          <XDRFLQResistanceGraph assays={assays} />
        </>
      ) : null}

      <Reports className={cssClasses('Section--withStatus')} title={formatMessage(messages.reportsTitle)} />
    </div>
  )
}

export default Status

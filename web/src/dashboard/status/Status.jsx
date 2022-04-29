import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { useSelector, useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet'
import { useLocation } from 'react-router-dom'

import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { fetchAssays } from '../../assay/AssayRedux'
import messages from './messages'
import SummaryStatus from './SummaryStatus'
import Reports from './Reports'
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown'
import { useAuthState } from '../../Providers/AuthProvider'
import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import hivGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/HIV'
import covidGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Covid'
import tbGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TB'
import xdrGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/XDR'
import treatmentStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Treatments'
import inventoryStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Inventory'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'
import testsPerFormedGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TestsPerformed'
import useI18n from '../../Hooks/i18n/useI18n'

import styles from './Status.css'

const cssClasses = classnames.bind(styles)

const Status = () => {
  const location = useLocation()
  const { formatMessage } = useI18n()
  const [graphs, setGraphs] = useState(false)
  const [marginBottom] = useState(0)
  const dispatch = useDispatch()
  const {
    countryAbbreviation: countryIsoAlpha2CodeIgnored,
    jwt: { name: userName },
    culture,
  } = useAuthState()

  const assays = useSelector(({ assay }) =>
    assay.items.toJS().filter(a => a.hasResults)
  )

  useEffect(() => {
    dispatch(fetchAssays(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const { search } = location
    const searchParams = new URLSearchParams(search)

    if (searchParams.has('fl')) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName },
      })
    }
  }, [userName, location])

  useEffect(() => {
    if (culture) {
      const { hivResults } = hivGraphs
      const { tbDetected, tbResults } = tbGraphs
      const { xdrResults } = xdrGraphs
      const {
        covidResults,
        covidDailyConfirmed,
        covidCasesByAgeAndGender,
        covidMortalityAndRecoveryConfig,
        covidMortalityAndRecoveryByGender,
      } = covidGraphs
      const { treatmentStatus } = treatmentStatusGraphs
      const { inventoryStatus } = inventoryStatusGraphs
      const { deviceStatus } = deviceStatusGraphs()
      const { testsOverTime } = testsPerFormedGraphs
      setGraphs([
        testsOverTime,
        hivResults,
        tbDetected,
        tbResults,
        xdrResults,
        covidResults,
        treatmentStatus,
        deviceStatus,
        covidDailyConfirmed,
        covidMortalityAndRecoveryConfig,
        covidMortalityAndRecoveryByGender,
        covidCasesByAgeAndGender,
        inventoryStatus,
      ])
    }
  }, [culture])

  return (
    <div className={cssClasses('Container')} style={{ marginBottom }}>
      <Helmet title="Status" />
      <div className={cssClasses('FiltersGroup')}>
        <BrowseSiteDropdown />
      </div>
      <ErrorBoundary>
        <PermissionsProvider permissions={['dashboard']}>
          <SummaryStatus
            className={cssClasses('Section--summary')}
            dashboard="home"
          />
        </PermissionsProvider>
      </ErrorBoundary>

      {graphs
        ? graphs.map(graph => (
            <ErrorBoundary key={graph.id}>
              <PermissionsProvider permissions={graph.graphRenderPermissions}>
                {assays?.length ? (
                  <GraphsContainer assaysFromState={assays} config={graph} />
                ) : null}
              </PermissionsProvider>
            </ErrorBoundary>
          ))
        : null}

      <Reports
        className={cssClasses('Section--withStatus')}
        title={formatMessage(messages.reportsTitle)}
      />
    </div>
  )
}

export default Status

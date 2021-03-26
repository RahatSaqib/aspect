/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useSelector, useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'

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
import treatmentStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Treatments'
import inventoryStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Inventory'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'
import testsPerFormedGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TestsPerformed'

const cssClasses = classnames.bind(require('./Status.css'))

const Status = ({ history, location }) => {
  const intl = useIntl()
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

  if (graphs?.length) {
    // console.log(graphs[6].selectorModifiers[0].data.deviceDateRange[0])
  }

  return (
    <div className={cssClasses('Container')} style={{ marginBottom }}>
      <Helmet title="Status" />
      <div className={cssClasses('FiltersGroup')}>
        <BrowseSiteDropdown intl={intl} history={history} location={location} />
      </div>
      <ErrorBoundary>
        <PermissionsProvider permissions={['dashboard']}>
          <SummaryStatus
            intl={intl}
            history={history}
            location={location}
            className={cssClasses('Section--summary')}
            dashboard="home"
          />
        </PermissionsProvider>
      </ErrorBoundary>

      {graphs
        ? graphs.map(graph => (
            <ErrorBoundary>
              <PermissionsProvider permissions={graph.graphRenderPermissions}>
                {assays?.length ? (
                  <GraphsContainer assaysFromState={assays} config={graph} />
                ) : null}
              </PermissionsProvider>
            </ErrorBoundary>
          ))
        : null}

      <Reports
        intl={intl}
        location={location}
        className={cssClasses('Section--withStatus')}
        title={intl.formatMessage(messages.reportsTitle)}
      />
    </div>
  )
}

Status.propTypes = {
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default Status

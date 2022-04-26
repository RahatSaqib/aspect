/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
// import PropTypes from 'prop-types'
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
import ColorDemo from './ColorDemo/ColorDemo'

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
        // testsOverTime,
        // hivResults,
        // tbDetected,
        // tbResults,
        // xdrResults,
        // covidResults,
        // treatmentStatus,
        // deviceStatus,
        // covidDailyConfirmed,
        // covidMortalityAndRecoveryConfig,
        // covidMortalityAndRecoveryByGender,
        // covidCasesByAgeAndGender,
        // inventoryStatus,
      ])
    }
  }, [culture])

  return (
    <div className={cssClasses('Container')} style={{ marginBottom }}>
      <Helmet title="Status" />
      <div className={cssClasses('FiltersGroup')}>
        <BrowseSiteDropdown />
      </div>
      {/* <ErrorBoundary>
        <PermissionsProvider permissions={['dashboard']}>
          <SummaryStatus
            className={cssClasses('Section--summary')}
            dashboard="home"
          />
        </PermissionsProvider>
      </ErrorBoundary> */}

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

      <ColorDemo
        name1='Graph "TB Results"'
        vars1={{
          '--aspect-color-conifer': {
            color: '#99D25D',
            name: 'Not Detected',
          },
          '--aspect-color-mint': { color: '#d4ffdf', name: 'Mint' },
          '--aspect-color-tara': { color: '#D0F1DA', name: 'Tara' },
          '--aspect-color-hint': { color: '#EBFFEB', name: 'Hint' },
        }}
        vars2={{
          '--aspect-color-pink': { color: '#ffc9c4', name: 'No result' },
          '--aspect-color-stone': { color: '#333333', name: 'Stone' },
          '--aspect-color-slate': { color: '#666666', name: 'Slate' },
          '--aspect-color-dusk': { color: '#999999', name: 'Dusk' },
        }}
        vars3={{
          '--aspect-color-pink': { color: '#EB6562', name: 'Trace Detected' },
          '--aspect-color-tangerine': { color: '#FF9A5C', name: 'Tangerine' },
          '--aspect-color-crayola': { color: '#FFC099', name: 'Crayola' },
          '--aspect-color-champagne': { color: '#FFE6D6', name: 'Champagne' },
        }}
        name2='Graph "TB Rif Resistance"'
        vars4={{
          '--aspect-color-conifer': {
            color: '#99D25D',
            name: 'Not Detected',
          },
          '--aspect-color-middle': { color: '#7AD3E1', name: 'Middle' },
          '--aspect-color-baby': { color: '#85D8FF', name: 'Baby' },
          '--aspect-color-powder': { color: '#BCE9F0', name: 'Powder' },
        }}
        name3='Graph "Covid Results"'
        vars5={{
          '--aspect-color-pink': {
            color: '#ffc9c4',
            name: 'Not Result',
          },
          '--aspect-color-stone': { color: '#333333', name: 'Stone' },
          '--aspect-color-slate': { color: '#666666', name: 'Slate' },
          '--aspect-color-dusk': { color: '#999999', name: 'Dusk' },
        }}
        vars6={{
          '--aspect-color-conifer': {
            color: '#99D25D',
            name: 'Covid Detected',
          },
          '--aspect-color-mint': { color: '#d4ffdf', name: 'Mint' },
          '--aspect-color-tara': { color: '#D0F1DA', name: 'Tara' },
          '--aspect-color-hint': { color: '#EBFFEB', name: 'Hint' },
        }}
      />

      <Reports
        className={cssClasses('Section--withStatus')}
        title={formatMessage(messages.reportsTitle)}
      />
    </div>
  )
}

export default Status

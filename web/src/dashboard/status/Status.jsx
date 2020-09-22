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
import InventoryStatus from './InventoryStatus'
import SiteStatus from './SiteStatus'
import ActionStatus from './ActionStatus'
import TargetStatus from './TargetStatus'
import Reports from './Reports'
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown'
import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import hivGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/HIV'
import covidGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Covid'
import tbGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/TB'
import treatmentStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Treatments'
import inventoryStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Inventory'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'

import ColorDemo from './ColorDemo/ColorDemo'

const cssClasses = classnames.bind(require('./Status.css'))

const Status = ({ history, location, colorDemo }) => {
  const intl = useIntl()
  const { hivResults } = hivGraphs
  const { tbDetected, tbResults } = tbGraphs
  const { treatmentStatus } = treatmentStatusGraphs
  const { inventoryStatus } = inventoryStatusGraphs
  const { deviceStatus } = deviceStatusGraphs
  const {
    covidDailyConfirmed,
    covidCasesByAgeAndGender,
    covidMortalityAndRecoveryConfig,
    covidMortalityAndRecoveryByGender,
  } = covidGraphs
  const [marginBottom, setMarginBottom] = useState(0)
  const dispatch = useDispatch()
  const userName = useSelector(({ user }) => user.jwt.name)
  const countryIsoAlpha2Code = useSelector(
    ({ user }) => user.countryAbbreviation
  )
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

      {/* <ErrorBoundary>
        <PermissionsProvider permissions={hivResults.graphRenderPermissions}>
          {assays && assays.length ? (
            <GraphsContainer assaysFromState={assays} config={hivResults} />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider permissions={tbDetected.graphRenderPermissions}>
          {assays && assays.length ? (
            <GraphsContainer assaysFromState={assays} config={tbDetected} />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider permissions={tbResults.graphRenderPermissions}>
          {assays && assays.length ? (
            <GraphsContainer assaysFromState={assays} config={tbResults} />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider
          permissions={treatmentStatus.graphRenderPermissions}
        >
          {assays && assays.length ? (
            <GraphsContainer
              assaysFromState={assays}
              config={treatmentStatus}
            />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary> */}

      {/* <ErrorBoundary>
        <PermissionsProvider permissions={deviceStatus.graphRenderPermissions}>
          {assays && assays.length ? (
            <GraphsContainer assaysFromState={assays} config={deviceStatus} />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary> */}

      {/* <ErrorBoundary>
        <PermissionsProvider
          permissions={covidDailyConfirmed.graphRenderPermissions}
        >
          {assays && assays.length ? (
            <GraphsContainer
              assaysFromState={assays}
              config={covidDailyConfirmed}
            />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider
          permissions={covidMortalityAndRecoveryConfig.graphRenderPermissions}
        >
          {assays && assays.length ? (
            <GraphsContainer
              assaysFromState={assays}
              config={covidMortalityAndRecoveryConfig}
            />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider
          permissions={covidMortalityAndRecoveryByGender.graphRenderPermissions}
        >
          {assays && assays.length ? (
            <GraphsContainer
              assaysFromState={assays}
              config={covidMortalityAndRecoveryByGender}
            />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider
          permissions={covidCasesByAgeAndGender.graphRenderPermissions}
        >
          {assays && assays.length ? (
            <GraphsContainer
              assaysFromState={assays}
              config={covidCasesByAgeAndGender}
            />
          ) : null}
        </PermissionsProvider>
      </ErrorBoundary>

      {colorDemo && <ColorDemo vars={process.env} />}
      <TargetStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--withDropdown')}
        title={intl.formatMessage(messages.targetsTitle)}
      />
      <ActionStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--withDropdown')}
        title={intl.formatMessage(messages.actionTitle)}
        marginBottom={marginBottom}
        setMarginBottom={setMarginBottom}
      />
      <SiteStatus
        history={history}
        intl={intl}
        countryIsoAlpha2Code={countryIsoAlpha2Code}
        className={cssClasses('Section--withStatus')}
        title={intl.formatMessage(messages.sitesTitle)}
      /> */}

      <ErrorBoundary>
        <PermissionsProvider
          permissions={inventoryStatus.graphRenderPermissions}
        >
          <GraphsContainer assaysFromState={assays} config={inventoryStatus} />
        </PermissionsProvider>
      </ErrorBoundary>

      <PermissionsProvider permissions={['dashboard']}>
        <InventoryStatus
          history={history}
          intl={intl}
          countryIsoAlpha2Code={countryIsoAlpha2Code}
          className={cssClasses('Section--withStatus')}
          title={intl.formatMessage(messages.consumableTitle)}
        />
      </PermissionsProvider>
      <Reports
        intl={intl}
        location={location}
        className={cssClasses('Section--withStatus')}
        title={intl.formatMessage(messages.reportsTitle)}
      />
    </div>
  )
}

Status.defaultProps = {
  colorDemo: false,
}

Status.propTypes = {
  colorDemo: PropTypes.bool,
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default Status

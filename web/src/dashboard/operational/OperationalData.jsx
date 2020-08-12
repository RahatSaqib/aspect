import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'

import SummaryStatus from '../status/SummaryStatus'
import InventoryItems from '../status/InventoryItems'

import ResultsTransmittedGraph from './ResultsTransmittedGraph'

import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'

const cssClasses = classnames.bind(require('./OperationalData.css'))

export const OperationalData = ({ intl, history, location, loading }) => {
  const { deviceStatus } = deviceStatusGraphs
  return (
    <div className={cssClasses('Container')}>
      <Helmet title="Operational Data" />
      {loading ? (
        <div className={cssClasses({ 'Content--loading': loading })} />
      ) : (
        <Fragment>
          <SummaryStatus
            intl={intl}
            history={history}
            location={location}
            className={cssClasses('Section--summary')}
            dashboard="operational"
          />

          <ResultsTransmittedGraph
            intl={intl}
            history={history}
            location={location}
          />

          <ErrorBoundary>
            <PermissionsProvider permissions={['operationalData']}>
              <GraphsContainer assaysFromState={[]} config={deviceStatus} />
            </PermissionsProvider>
          </ErrorBoundary>

          <InventoryItems
            intl={intl}
            history={history}
            location={location}
            className={cssClasses('Section--stock')}
          />
        </Fragment>
      )}
    </div>
  )
}

export default flowRight(
  injectIntl,
  connect(state => ({
    loading: !!state.getIn(['dashboard', 'requestedAt']),
    operational: state.getIn(['dashboard', 'operational']),
  }))
)(OperationalData)

/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment } from 'react'

import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'
import { useQuery } from 'react-query'

import SummaryStatus from '../status/SummaryStatus'
import InventoryItems from '../status/InventoryItems'

import PermissionsProvider from '../../Providers/PermissionsProvider'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'
import resultsTransmittedGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/ResultsTransmitted'

import { ASSAY_LIST } from '../../MigratedComponents/QueryFetch/Assay/index'

const cssClasses = classnames.bind(require('./OperationalData.css'))

export const OperationalData = ({ intl, history, location, loading }) => {
  const { deviceStatus } = deviceStatusGraphs
  const { resultsTransmitted } = resultsTransmittedGraphs

  const { isError, data: { data: assays } = false, error } = useQuery(ASSAY_LIST.KEY, async () =>
    fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT})
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <div className={cssClasses('Container')}>
      <Helmet title="Operational Data" />
      {loading ? (
        <div className={cssClasses({ 'Content--loading': loading })} />
      ) : (
        <Fragment>
          <ErrorBoundary>
            <PermissionsProvider permissions={['operationalData']}>
              <SummaryStatus
                intl={intl}
                history={history}
                location={location}
                className={cssClasses('Section--summary')}
                dashboard="operational"
              />
            </PermissionsProvider>
          </ErrorBoundary>

          <ErrorBoundary>
            <PermissionsProvider permissions={['operationalData']}>
              {assays && assays.length ? (
                <GraphsContainer
                  assaysFromState={assays}
                  config={resultsTransmitted}
                />
              ) : null}
            </PermissionsProvider>
          </ErrorBoundary>

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

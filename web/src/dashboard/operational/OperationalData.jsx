/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect } from 'react'

import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { connect, useSelector, useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'

import SummaryStatus from '../status/SummaryStatus'
import InventoryItems from '../status/InventoryItems'

import { fetchAssays } from '../../assay/AssayRedux'
import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'
import resultsTransmittedGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/ResultsTransmitted'

const cssClasses = classnames.bind(require('./OperationalData.css'))

export const OperationalData = ({ intl, history, location, loading }) => {
  const { deviceStatus } = deviceStatusGraphs
  const { resultsTransmitted } = resultsTransmittedGraphs
  const dispatch = useDispatch()
  const assays = useSelector(({ assay }) =>
    assay.items.toJS().filter(a => a.hasResults)
  )

  useEffect(() => {
    dispatch(fetchAssays(false))
  }, [])

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

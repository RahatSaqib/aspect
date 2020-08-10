import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'

import SummaryStatus from '../status/SummaryStatus'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import InventoryItems from '../status/InventoryItems'
import ResultsTransmittedGraph from './ResultsTransmittedGraph'

const cssClasses = classnames.bind(require('./OperationalData.css'))

export const OperationalData = ({ intl, history, location, loading }) => {
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
          <GraphsContainer
            intl={intl}
            history={history}
            location={location}
            assaysFromState={[]}
          />
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

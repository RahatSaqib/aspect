import classnames from 'classnames/bind'
import React from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'

import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'

const cssClasses = classnames.bind(require('./OperationalData.css'))

export const OperationalData = ({ intl, history, location, loading }) => {
  return (
    <div className={cssClasses('Container')}>
      <Helmet title="Operational Data" />
      {loading ? (
        <div className={cssClasses({ 'Content--loading': loading })} />
      ) : (
        <div>
          <GraphsContainer
            intl={intl}
            history={history}
            location={location}
            assaysFromState={[]}
          />
        </div>
      )}
    </div>
  )
}

export default _.flowRight(
  injectIntl,
  connect(state => ({
    loading: !!state.getIn(['dashboard', 'requestedAt']),
    operational: state.getIn(['dashboard', 'operational']),
  }))
)(OperationalData)

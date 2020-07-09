import classnames from 'classnames/bind'
import React from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'

import SummaryStatus from '../status/SummaryStatus'
import InventoryItems from '../status/InventoryItems'

const cssClasses = classnames.bind(require('./OperationalData.css'))

export const OperationalData = ({ history, location, intl, loading }) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Operational Data" />

    <SummaryStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--summary')}
      dashboard="operational"
    />
    <InventoryItems
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--stock')}
    />
    <div className={cssClasses({ 'Content--loading': loading })} />
  </div>
)

export default _.flowRight(
  injectIntl,
  connect(state => ({
    loading: !!state.getIn(['dashboard', 'requestedAt']),
    operational: state.getIn(['dashboard', 'operational']),
  }))
)(OperationalData)

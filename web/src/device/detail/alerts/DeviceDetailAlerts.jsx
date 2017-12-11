import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import Helmet from 'react-helmet'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import Summary from '../Summary'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const enhance = _.identity

export const DeviceDetailAlerts = ({
  intl,
  history,
  location,
  match,
  device,
  // --- injected by recompose ---
}) => (
  <div>
    <Helmet title={device.get('name')} />
    <DeviceDetailBackBar
      intl={intl}
      history={history}
      location={location}
      match={match}
      title={device.get('name')}
    />
    <section className={cssClasses('Section', 'Section--first')}>
      <div className={cssClasses('Section__Content')}>
        <Summary title="Alerts" description="TODO" />
      </div>
    </section>
  </div>
)

export default enhance(DeviceDetailAlerts)

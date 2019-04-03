import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import Helmet from 'react-helmet'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import Summary from '../../../globals/components/Summary'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const enhance = _.identity

export const DeviceDetailAlerts = ({
  intl,
  history,
  location,
  match,
  device,
  // --- injected by recompose ---
}) => {
  const deviceName = `${device.getIn(['deviceType', 'name'])} at ${device.get(
    'siteName'
  )}`
  return (
    <div>
      <Helmet title={deviceName} />
      <DeviceDetailBackBar
        intl={intl}
        history={history}
        location={location}
        match={match}
        title={deviceName}
      />
      <section className={cssClasses('Section', 'Section--first')}>
        <div className={cssClasses('Section__Content')}>
          <Summary title="Alerts" description="TODO" />
        </div>
      </section>
    </div>
  )
}

export default enhance(DeviceDetailAlerts)

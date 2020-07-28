import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Helmet } from 'react-helmet'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import TaskList from '../../../task/list/TaskList'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const enhance = _.identity

export const DeviceDetailAlerts = ({
  intl,
  history,
  location,
  match,
  device,
  disabled,
  // --- injected by recompose ---
}) => {
  const deviceName = device.get('name')
  const { deviceId } = match.params
  return (
    <div>
      <Helmet title={deviceName} />
      <DeviceDetailBackBar
        intl={intl}
        history={history}
        location={location}
        match={match}
        disabled={disabled}
        title={deviceName}
      />
      <section className={cssClasses('Section', 'Section--first')}>
        <TaskList
          intl={intl}
          history={history}
          location={location}
          filterOptions={{
            deviceId,
          }}
        />
      </section>
    </div>
  )
}

export default enhance(DeviceDetailAlerts)

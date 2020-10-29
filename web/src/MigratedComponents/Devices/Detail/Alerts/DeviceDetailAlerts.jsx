import React from 'react'
import PropTypes from 'prop-types'
import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import { Helmet } from 'react-helmet'

import TaskList from '../../../../task/list/TaskList'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const enhance = identity

export const DeviceDetailAlerts = ({
  history,
  location,
  match: { params: { deviceId = false } } = false,
  device,
}) => {
  const intl = useIntl()
  const deviceName = device.get('name')
  return (
    <div>
      <Helmet title={deviceName} />
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

DeviceDetailAlerts.propTypes = {
  history: PropTypes.oneOf([PropTypes.object]).isRequired,
  location: PropTypes.oneOf([PropTypes.object]).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      deviceId: PropTypes.string,
    }),
  }).isRequired,
  device: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default enhance(DeviceDetailAlerts)

import React from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useParams } from 'react-router-dom'
import TaskList from '../../../../oldPages/task/list/TaskList'
import styles from '../styles.module.css'

const DeviceDetailAlerts = ({ navigate, location, device }) => {
  const { deviceId = false } = useParams()
  const intl = useIntl()
  const deviceName = device.get('name')
  return (
    <div>
      <Helmet title={deviceName} />
      <section className={`${styles.Section} ${styles.Section__first}`}>
        <TaskList
          intl={intl}
          navigate={navigate}
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
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  device: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default DeviceDetailAlerts

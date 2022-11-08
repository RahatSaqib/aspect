import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'
import useI18n from '../../../../hooks/useI18n'
import TaskList from '../../../../oldPages/task/list/TaskList'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

export const DeviceDetailAlerts = ({ navigate, location, device }) => {
  const { deviceId = false } = useParams()
  const intl = useI18n()
  const deviceName = device.get('name')
  return (
    <div>
      <Helmet title={deviceName} />
      <section className={cssClasses('Section', 'Section--first')}>
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

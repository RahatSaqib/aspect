import React from 'react'
import PropTypes from 'prop-types'
import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'

import TaskList from '../../../../task/list/TaskList'

import styles from '../DeviceDetail.css'
import useI18n from '../../../../Hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const enhance = identity

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

export default enhance(DeviceDetailAlerts)

import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import styles from './ChartAlert.css'

const cssClasses = classnames.bind(styles)

const Alert = ({ status, statusString }) =>
  <div>
    <p
      className={cssClasses({
        green: status === 'green',
        amber: status === 'amber',
        red: status !== 'green' && status !== 'amber', // if incorrectly entered
      })}
    />
    <p className={cssClasses('textAlert')}>
      {statusString}
    </p>
  </div>

Alert.propTypes = {
  status: PropTypes.string,
  statusString: PropTypes.string.isRequired,
}

Alert.defaultProps = {
  status: 'red',
}

export default Alert

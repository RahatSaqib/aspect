import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import styles from './ChartAlert.css'

const cssClasses = classnames.bind(styles)

const Alert = ({ status, statusString }) => {
  // sets red as default alert status if incorrectly entered
  if (status !== 'green' && status !== 'amber') {
    status = 'red'
  }

  return (
    <div>
      <p className={cssClasses(status)} />
      <p className={cssClasses('textAlert')}>{statusString}</p>
    </div>
  )
}

Alert.propTypes = {
  status: PropTypes.string,
  statusString: PropTypes.string.isRequired,
}

Alert.defaultProps = {
  status: 'red',
}

export default Alert

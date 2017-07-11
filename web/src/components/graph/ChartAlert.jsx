import React from 'react'
import PropTypes from 'prop-types'
import './Alert.css'

const Alert = ({ status, statusString }) => {
  // sets red as default alert status if incorrectly entered
  if (status !== 'green' && status !== 'amber') {
    status = 'red'
  }

  return (
    <div>
      <p className={status} />
      <p className="textAlert">{statusString}</p>
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

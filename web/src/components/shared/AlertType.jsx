import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaBell from 'react-icons/lib/fa/bell'
import FaCircleO from 'react-icons/lib/fa/circle-o'
import FaCircle from 'react-icons/lib/fa/circle'

const cssClasses = classnames.bind(require('./AlertType.css'))

const enhance = _.identity

const AlertType = ({ alertType, ...restProps }) => {
  if (alertType === 'mine') {
    return (
      <FaCircle
        {...restProps}
        className={cssClasses(restProps.className, 'FaCircle')}
      />
    )
  }
  if (alertType === 'normal') {
    return (
      <FaCircleO
        {...restProps}
        className={cssClasses(restProps.className, 'FaCircleO')}
      />
    )
  }
  if (alertType === 'snoozed') {
    return (
      <span
        {...restProps}
        className={cssClasses(restProps.className, 'FaBell')}
      >
        <FaBell />
      </span>
    )
  }
}

export default enhance(AlertType)

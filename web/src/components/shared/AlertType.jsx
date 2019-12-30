import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { FaRegCircle as FaCircleO, FaCircle } from 'react-icons/fa'

const cssClasses = classnames.bind(require('./AlertType.css'))

const enhance = _.identity

const AlertType = ({ alertType, ...restProps }) => {
  if (['Active', 'Due Soon', 'Due Now', 'Overdue'].indexOf(alertType) >= 0) {
    return (
      <FaCircle
        {...restProps}
        className={cssClasses(restProps.className, 'FaCircle')}
      />
    )
  }

  return (
    <FaCircleO
      {...restProps}
      className={cssClasses(restProps.className, 'FaCircleO')}
    />
  )
}

export default enhance(AlertType)

import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import { FaRegCircle as FaCircleO, FaCircle } from 'react-icons/fa'
import styles from './AlertType.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const AlertType = ({ alertType, ...restProps }) => {
  if (['Active', 'Due Soon', 'Due Now', 'Overdue'].indexOf(alertType) >= 0) {
    return <FaCircle {...restProps} className={cssClasses(restProps.className, 'FaCircle')} />
  }

  return <FaCircleO {...restProps} className={cssClasses(restProps.className, 'FaCircleO')} />
}

export default enhance(AlertType)

import React from 'react'
import { FaRegCircle as FaCircleO, FaCircle } from 'react-icons/fa'
import styles from './AlertType.module.css'

const AlertType = ({ alertType, ...restProps }) => {
  if (['Active', 'Due Soon', 'Due Now', 'Overdue'].indexOf(alertType) >= 0) {
    return <FaCircle {...restProps} className={`${styles[restProps.className]} ${styles.FaCircle}`} />
  }

  return <FaCircleO {...restProps} className={`${styles[restProps.className]} ${styles.FaCircleO}`} />
}

export default AlertType

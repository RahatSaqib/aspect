import React from 'react'
import styles from './ButtonGroup.module.css'

const ButtonGroup = ({ isolated, adjacent, className, children }) => {
  const classes = `${styles[className]} ButtonGroup ${isolated ? 'ButtonGroup__isolated' : ''} ${
    adjacent ? 'ButtonGroup__adjacent' : ''
  }`
  return <div className={classes}>{children}</div>
}

export default ButtonGroup

import React from 'react'
import classnames from 'classnames/bind'
import styles from './ButtonGroup.css'

const cssClasses = classnames.bind(styles)

const ButtonGroup = ({ isolated, adjacent, className, children }) => (
  <div
    className={cssClasses(className, 'ButtonGroup', {
      'ButtonGroup--isolated': isolated,
      'ButtonGroup--adjacent': adjacent,
    })}
  >
    {children}
  </div>
)

export default ButtonGroup

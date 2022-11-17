import React from 'react'
import classnames from 'classnames/bind'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

export const Title = ({ className, icon, title }) => (
  <div className={cssClasses('Title', className)}>
    {icon}
    <span className={cssClasses('Title__Label', className)}>{title}</span>
  </div>
)

export default Title

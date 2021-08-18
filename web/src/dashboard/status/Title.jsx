import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

import styles from './Status.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

export const Title = ({ className, icon, title }) => (
  <div className={cssClasses('Title', className)}>
    {icon}
    <span className={cssClasses('Title__Label', className)}>{title}</span>
  </div>
)

export default enhance(Title)

import React from 'react'
import classNames from 'classnames/bind'
import IconProvider from '../../IconProvider'
import styles from './AspectMessageField.css'

const cssClasses = classNames.bind(styles)

const AspectMessageField = ({ controlType: { text, color, icon } }) => {
  return (
    <div style={{ color }} className={cssClasses('messageField')}>
      {icon && <IconProvider icon={icon} />} {text}
    </div>
  )
}

export default AspectMessageField

import React from 'react'
import styles from './Icon.module.css'

const Icon = ({ type, className, size = 'md', ...restProps }) => {
  const classes = `${styles[className]} Icon Icon__${size}`
  return (
    <svg className={classes} {...restProps}>
      <use xlinkHref={`${type.default.url}`} />
    </svg>
  )
}

export default Icon

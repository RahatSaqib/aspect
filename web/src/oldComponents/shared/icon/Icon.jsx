import React from 'react'
import classnames from 'classnames/bind'
import styles from './Icon.css'

const cssClasses = classnames.bind(styles)

export const Icon = ({ type, className, size = 'md', ...restProps }) => (
  <svg className={cssClasses(className, 'Icon', `Icon--${size}`)} {...restProps}>
    <use xlinkHref={`${type.default.url}`} />
  </svg>
)

export default Icon

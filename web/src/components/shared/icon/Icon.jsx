import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./Icon.css'))

export const Icon = ({ type, className, size = 'md', ...restProps }) => (
  <svg
    className={cssClasses(className, 'Icon', `Icon--${size}`)}
    {...restProps}
  >
    <use xlinkHref={`${type.default.url}`} />
  </svg>
)

export default Icon

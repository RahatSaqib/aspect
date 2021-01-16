import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import isObject from 'lodash/isObject'

import { useUserIsPermitted } from '../../Hooks/RoutePermissions/index.jsx'

const isURL = to => {
  if (!to) return false
  const expression = /^https?:/
  const regex = new RegExp(expression)
  return to.match(regex)
}

const AspectLink = ({ to = '#', children, className, ...restProps }) => {
  let linkClassName
  const { isPermitted } = useUserIsPermitted(to)
  if (isObject(className)) {
    linkClassName = isPermitted
      ? (linkClassName = className.active)
      : className.disabled
  }
  return (
    <Fragment>
      {isPermitted && isURL(to) ? (
        <a
          {...restProps}
          href={to}
          target="_blank"
          className={linkClassName}
          rel="noreferrer"
        >
          {children}
        </a>
      ) : null}
      {isPermitted && !isURL(to) ? (
        <Link to={to} {...restProps} className={linkClassName}>
          {children}
        </Link>
      ) : null}
      {!isPermitted ? (
        <a {...restProps} className={linkClassName}>
          {children}
        </a>
      ) : null}
    </Fragment>
  )
}

export default AspectLink

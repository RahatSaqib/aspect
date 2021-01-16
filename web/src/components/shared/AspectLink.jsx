import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import { useUserIsPermitted } from '../../Hooks/RoutePermissions/index.jsx'

const isURL = to => {
  if (!to) return false
  const expression = /^https?:/
  const regex = new RegExp(expression)
  return to.match(regex)
}

const BaseLink = ({ children, to, ...rest }) => (
  <a href={to} target="_blank" {...rest} rel="noreferrer">
    {children}
  </a>
)

const AspectLink = ({ to = '#', children, ...restProps }) => {
  const { isPermitted } = useUserIsPermitted(to)
  // console.log(isPermitted)

  return (
    <Fragment>
      {isPermitted && isURL(to) ? (
        <BaseLink to={to} {...restProps}>
          {children}
        </BaseLink>
      ) : null}
      {isPermitted && !isURL(to) ? (
        <Link to={to} {...restProps}>
          {children}
        </Link>
      ) : null}
      {!isPermitted ? <div {...restProps}>{children}</div> : null}
    </Fragment>
  )
}

export default AspectLink

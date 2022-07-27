import React, { Fragment } from 'react'
import { string, object, number, oneOfType } from 'prop-types'
import { Link } from 'react-router-dom'
import isObject from 'lodash/isObject'

import { useUserIsPermitted } from '../../Providers/RoutePermissions'

/**
 * The AspectLink component provides
 * consistent method to link internally
 * and externally
 */

const isURL = to => {
  if (!to) return false
  const expression = /^https?:/
  const regex = new RegExp(expression)
  return to.match(regex)
}

const AspectLink = ({ to, children, className, ...restProps }) => {
  to = to || '#'
  let linkClassName
  const { isPermitted } = useUserIsPermitted(to)
  if (isObject(className)) {
    linkClassName = isPermitted ? className.active : className.disabled
  }

  return (
    <Fragment>
      {isPermitted && isURL(to) ? (
        <a {...restProps} href={to} target="_blank" className={linkClassName} rel="noreferrer">
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

AspectLink.defaultProps = {
  className: null,
  to: '#',
}

AspectLink.propTypes = {
  /**
   Optional classname for the link
  */
  className: oneOfType([object, string]),
  /**
  React children of the link
 */
  children: oneOfType([object, string, number]).isRequired,
  /**
  Proposed URL for link component
  */
  to: string,
}

export default AspectLink

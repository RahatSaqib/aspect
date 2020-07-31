import React from 'react'
import { Link } from 'react-router-dom'

const isURL = to => {
  const expression = /^https?:/
  const regex = new RegExp(expression)
  return to.match(regex)
}

const AspectLink = ({ to = '#', children, ...restProps }) => {
  return isURL(to) ? (
    <a href={to} target="_blank" {...restProps} rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link to={to} {...restProps}>
      {children}
    </Link>
  )
}

export default AspectLink

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

const isURL = to => {
  const expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/
  const regex = new RegExp(expression)
  return to.match(regex)
}

const AspectLink = ({ to, children, ...restProps }) => {
  to = to ?? '#'
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

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import MUILink from '@material-ui/core/Link'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'

const Link = ({ label, theme, disabled, onClick, ...restProps }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const onLinkClick = event => {
    event.preventDefault()
    const { currentTarget } = event
    const { pathname } = currentTarget
    navigate(pathname)
  }

  return (
    <MUILink
      component={RouterLink}
      disabled={disabled}
      {...restProps}
      onClick={onClick || onLinkClick}
      className={classNames(theme.link, {
        [theme.active]: new RegExp(`^${restProps.href}`).test(location.pathname),
      })}
      to={restProps.href}
    >
      <abbr>{label}</abbr>
    </MUILink>
  )
}

Link.defaultProps = {
  disabled: false,
  onClick: null,
}

Link.propTypes = {
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  theme: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default Link

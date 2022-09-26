import React from 'react'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined'
import MUILink from '@mui/material/Link'
import classNames from 'classnames'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

const ThemedLink = props => {
  const { onClick, label, anchorEl } = props
  const navigate = useNavigate()
  const location = useLocation()

  const onLinkClick = event => {
    event.preventDefault()
    navigate(event.currentTarget.pathname)
  }

  return props.href !== 'none' ? (
    <MUILink
      component={RouterLink}
      {...props}
      onClick={onLinkClick}
      className={classNames(cssClasses('Link__link'), {
        [cssClasses('Link__active')]: new RegExp(`^${props.href}`).test(location.pathname),
      })}
      to={props.href}
    >
      <abbr>{label}</abbr>
    </MUILink>
  ) : (
    <div
      role="menuitem"
      tabIndex={0}
      onKeyPress={onClick}
      onClick={onClick}
      className={classNames(cssClasses('Link__link'), {
        [cssClasses('Link__active')]: new RegExp(`^/browse`).test(location.pathname),
      })}
    >
      <abbr>
        {label}
        {anchorEl ? (
          <KeyboardArrowUpOutlinedIcon className={cssClasses('icon_position')} />
        ) : (
          <KeyboardArrowDownOutlinedIcon className={cssClasses('icon_position')} />
        )}
      </abbr>
    </div>
  )
}

ThemedLink.defaultProps = {
  href: 'none',
  requiredPermissions: [],
  onClick: () => {},
  anchorEl: 'none',
}

ThemedLink.propTypes = {
  href: PropTypes.string,
  label: PropTypes.string.isRequired,
  requiredPermissions: PropTypes.oneOfType([PropTypes.array]),
  onClick: PropTypes.func,
  anchorEl: PropTypes.any,
}

export default ThemedLink

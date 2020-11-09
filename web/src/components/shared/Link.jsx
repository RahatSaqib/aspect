import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import MUILink from '@material-ui/core/Link'
import { useHistory, useLocation } from 'react-router-dom'

const Link = ({ label, theme, disabled, ...restProps }) => {
  const history = useHistory()
  const location = useLocation()

  const onLinkClick = event => {
    event.preventDefault()
    const { currentTarget } = event
    const { pathname } = currentTarget
    history.push(pathname)
  }

  return (
    <MUILink
      history={history}
      location={location}
      disabled={disabled}
      {...restProps}
      onClick={onLinkClick}
      className={classNames(theme.link, {
        [theme.active]: new RegExp(`^${restProps.href}`).test(
          location.pathname
        ),
      })}
    >
      <abbr>{label}</abbr>
    </MUILink>
  )
}

Link.defaultProps = {
  disabled: false,
}

Link.propTypes = {
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onLinkClick: PropTypes.func.isRequired,
  theme: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default Link

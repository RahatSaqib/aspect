import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import PermissionsProvider from '../../../Providers/PermissionsProvider'
import Link from '../../../components/shared/Link'

const cssClasses = classnames.bind(require('./index.css'))

const themes = {
  Link: {
    link: cssClasses('Link__link'),
    active: cssClasses('Link__active'),
    icon: cssClasses('Link__icon'),
  },
}

const ThemedLink = props => {
  const { href, label, requiredPermissions, icon } = props
  return (
    <PermissionsProvider permissions={requiredPermissions}>
      <Link
        {...props}
        key={href}
        theme={themes.Link}
        title={label}
        icon={icon}
      />
    </PermissionsProvider>
  )
}

ThemedLink.defaultProps = {
  requiredPermissions: [],
  icon: false,
}

ThemedLink.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  requiredPermissions: PropTypes.oneOfType([PropTypes.array]),
  icon: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
}

export default ThemedLink

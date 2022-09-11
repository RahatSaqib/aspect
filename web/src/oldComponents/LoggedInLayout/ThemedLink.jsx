import React from 'react'
import classnames from 'classnames/bind'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import PermissionsProvider from '../../providers/PermissionsProvider'
import Link from '../shared/Link'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

const themes = {
  Link: {
    link: cssClasses('Link__link'),
    active: cssClasses('Link__active'),
    icon: cssClasses('Link__icon'),
  },
}

const ThemedLink = props => {
  const { href, label, requiredPermissions } = props
  const restProps = omit(props, ['requiredPermissions'])
  return (
    <PermissionsProvider permissions={requiredPermissions}>
      <Link key={href} theme={themes.Link} title={label} {...restProps} />
    </PermissionsProvider>
  )
}

ThemedLink.defaultProps = {
  href: 'none',
  requiredPermissions: [],
  onClick: () => {},
}

ThemedLink.propTypes = {
  href: PropTypes.string,
  label: PropTypes.string.isRequired,
  requiredPermissions: PropTypes.oneOfType([PropTypes.array]),
  onClick: PropTypes.func,
}

export default ThemedLink

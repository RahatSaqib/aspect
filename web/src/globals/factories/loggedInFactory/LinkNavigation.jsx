import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import ThemedLink from './ThemedLink'

const cssClasses = classnames.bind(require('./index.css'))

const rawLinks = [
  {
    href: '/dashboard',
    label: 'Home',
    requiredPermissions: ['dashboard:summary'],
  },
  {
    href: '/task-list',
    label: 'Task List',
    requiredPermissions: ['taskMenu'],
  },
  {
    href: '/operational-data',
    label: 'Operational  Data',
    requiredPermissions: ['operationalData'],
  },
  {
    href: '/clinical-indicators',
    label: 'Clinical Indicators',
    requiredPermissions: ['clinicalIndicators'],
  },
  {
    href: '/browse',
    label: 'Browse',
    requiredPermissions: ['browse'],
  },
  {
    href: '/reports',
    label: 'Reports',
    requiredPermissions: ['report'],
  },
  {
    href: '/manage',
    label: 'Manage',
    requiredPermissions: ['manage'],
  },
]

export const LinkNavigation = ({ type, onClick, children }) => (
  <nav
    type={type}
    className={cssClasses('Navigation', {
      'Navigation--vertical': type === 'vertical',
      'Navigation--horizontal': type === 'horizontal',
    })}
  >
    {rawLinks.map(link => (
      <ThemedLink key={link.label} {...link} onClick={onClick} />
    ))}
    {children}
  </nav>
)

LinkNavigation.defaultProps = {
  children: null,
}

LinkNavigation.propTypes = {
  type: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.object]),
}

export default LinkNavigation

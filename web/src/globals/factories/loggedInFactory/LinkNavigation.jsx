import classnames from 'classnames/bind'
import React from 'react'
import { connect } from 'react-redux'
import { compose, pure } from 'recompose'

import Link from '../../../components/shared/Link'
import { reduceNavLinks } from '../../../filter/utils'

const cssClasses = classnames.bind(require('./index.css'))

const themes = {
  Link: {
    link: cssClasses('Link__link'),
    active: cssClasses('Link__active'),
    icon: cssClasses('Link__icon'),
  },
}

export const makeThemedLink = props => (
  <Link {...props} key={props.href} theme={themes.Link} title={props.label} />
)

const enhance = compose(
  pure,
  connect(state => ({
    userPermissions: state.user.jwt.permissions,
  }))
)
export const LinkNavigation = ({
  history,
  location,

  type,
  userPermissions,
  onClick,
  children,
}) => {
  const reduceNav = reduceNavLinks(
    [
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
        requiredPermissions: ['operationalData:view', 'operationalData:admin'],
      },
      {
        href: '/clinical-indicators',
        label: 'Clinical Indicators',
        requiredPermissions: [
          'clinicalIndicators:admin',
          'clinicalIndicators:view',
        ],
      },
      {
        href: '/browse',
        label: 'Browse',
        requiredPermissions: ['browse:view', 'browse:admin'],
      },
      {
        href: '/reports',
        label: 'Reports',
        requiredPermissions: ['report:view', 'report:edit', 'report:admin'],
      },
      {
        href: '/manage',
        label: 'Manage',
        requiredPermissions: ['manage:view', 'manage:admin'],
      },
    ],
    userPermissions
  )
  return (
    <nav
      type={type}
      className={cssClasses('Navigation', {
        'Navigation--vertical': type === 'vertical',
        'Navigation--horizontal': type === 'horizontal',
      })}
    >
      {reduceNav.map(props =>
        makeThemedLink({
          ...props,
          history,
          location,
          onClick,
        })
      )}
      {children}
    </nav>
  )
}

export default enhance(LinkNavigation)

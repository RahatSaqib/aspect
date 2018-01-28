import classnames from 'classnames/bind'
import React from 'react'
import Navigation from 'react-toolbox/lib/navigation'
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
  <Link {...props} key={props.href} title={props.label} theme={themes.Link} />
)

const enhance = compose(
  pure,
  connect(state => ({
    userPermissions: state.user.jwt.permissions,
  }))
)
const LinkNavigation = ({
  history,
  location,

  type,
  userPermissions,
  onClick,
  children,
}) => {
  const reduceNav = reduceNavLinks(
    [
      { href: '/dashboard', label: 'Home', requiredPermissions: [] },
      {
        href: '/task-list',
        label: 'Task List',
        requiredPermissions: ['task:admin', 'task:view', 'task:edit'],
      },
      {
        href: '/operational-data',
        label: 'Operational  Data',
        requiredPermissions: [],
      },
      {
        href: '/clinical-indicators',
        label: 'Clinical Indicators',
        requiredPermissions: [],
      },
      { href: '/browse', label: 'Browse', requiredPermissions: [] },
      {
        href: '/reports',
        label: 'Reports',
        requiredPermissions: ['report:view', 'report:edit', 'report:admin'],
      },
      { href: '/manage', label: 'Manage', requiredPermissions: [] },
    ],
    userPermissions
  )
  return (
    <Navigation
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
    </Navigation>
  )
}

export default enhance(LinkNavigation)

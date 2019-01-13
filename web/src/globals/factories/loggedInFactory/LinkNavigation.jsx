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
  <Link {...props} key={props.href} theme={themes.Link} />
)

const enhance = compose(
  pure,
  connect(state => ({
    userPermissions: state.user.jwt.permissions,
    userFeatures: state.user.features,
  }))
)
export const LinkNavigation = ({
  history,
  location,

  type,
  userPermissions,
  userFeatures,
  onClick,
  children,
}) => {
  const reduceNav = reduceNavLinks(
    [
      {
        href: '/dashboard',
        label: 'Home',
        requiredPermissions: [],
        requiredFeatures: ['summaryDashboard'],
      },
      {
        href: '/task-list',
        label: 'Task List',
        requiredPermissions: ['task:admin', 'task:view', 'task:edit'],
        requiredFeatures: ['task'],
      },
      {
        href: '/operational-data',
        label: 'Operational  Data',
        requiredPermissions: [],
        requiredFeatures: ['operationalData'],
      },
      {
        href: '/clinical-indicators',
        label: 'Clinical Indicators',
        requiredPermissions: [],
        requiredFeatures: ['clinicalIndicators'],
      },
      {
        href: '/browse',
        label: 'Browse',
        requiredPermissions: ['browse:view'],
        requiredFeatures: [
          'device',
          'result',
          'person',
          'site',
          'inventory',
          'router',
          'reporter',
          'notification',
          'report',
          'deviceApiKey',
        ],
      },
      {
        href: '/reports',
        label: 'Reports',
        requiredPermissions: ['report:view', 'report:edit', 'report:admin'],
        requiredFeatures: ['reports'],
      },
      {
        href: '/manage',
        label: 'Manage',
        requiredPermissions: [],
        requiredFeatures: ['manage'],
      },
    ],
    userPermissions,
    userFeatures
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

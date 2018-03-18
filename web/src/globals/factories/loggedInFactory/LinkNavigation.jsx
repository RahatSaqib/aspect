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
    userFeatures: state.user.jwt.features,
  }))
)
const LinkNavigation = ({
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
        requiredFeatures: ['dashboard:true'],
      },
      {
        href: '/task-list',
        label: 'Task List',
        requiredPermissions: ['task:admin', 'task:view', 'task:edit'],
        requiredFeatures: ['taskList:true'],
      },
      {
        href: '/operational-data',
        label: 'Operational  Data',
        requiredPermissions: [],
        requiredFeatures: ['operationalData:true'],
      },
      {
        href: '/clinical-indicators',
        label: 'Clinical Indicators',
        requiredPermissions: [],
        requiredFeatures: ['clinicalIndicators:true'],
      },
      {
        href: '/browse',
        label: 'Browse',
        requiredPermissions: [],
        requiredFeatures: ['browse:true'],
      },
      {
        href: '/reports',
        label: 'Reports',
        requiredPermissions: ['report:view', 'report:edit', 'report:admin'],
        requiredFeatures: ['reports:true'],
      },
      {
        href: '/manage',
        label: 'Manage',
        requiredPermissions: [],
        requiredFeatures: ['manage:true'],
      },
    ],
    userPermissions,
    userFeatures
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

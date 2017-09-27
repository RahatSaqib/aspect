import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import Navigation from 'react-toolbox/lib/navigation'

import Link from '../../../components/shared/Link'

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

const enhance = _.identity

const LinkNavigation = ({
  history,
  location,

  type,
  onClick,
  children,
}) => (
  <Navigation
    type={type}
    className={cssClasses('Navigation', {
      'Navigation--vertical': type === 'vertical',
      'Navigation--horizontal': type === 'horizontal',
    })}
  >
    {[
      { href: '/dashboard', label: 'Home' },
      { href: '/task-list', label: 'Task List' },
      { href: '/operational-data', label: 'Operational  Data' },
      { href: '/clinical-indicators', label: 'Clinical Indicators' },
      { href: '/browse', label: 'Browse' },
      { href: '/reports', label: 'Reports' },
      { href: '/manage', label: 'Manage' },
    ].map(props =>
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

export default enhance(LinkNavigation)

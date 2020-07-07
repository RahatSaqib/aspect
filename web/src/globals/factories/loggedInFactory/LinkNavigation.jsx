import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import classnames from 'classnames/bind'

import ThemedLink from './ThemedLink'

import { reduceNavLinks } from '../../../filter/utils'
import requirePermissions from '../../../components/shared/requirePermissions'

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
]

// const enhance = compose(
//   pure,
//   connect(state => ({
//     userPermissions: state.user.jwt.permissions,
//   }))
// )
export const LinkNavigation = ({
  history,
  location,
  type,
  onClick,
  children,
}) => {
  // const [permissions] = useState(false)
  // const [userNav, setUserNav] = useState(false)
  // const { permissions } = useSelector(({ user }) => {
  //   // console.log(user.toJS().jwt)
  //   return user.jwt
  // })
  // console.log(permissions)

  // useEffect(() => {
  //   if (permissions) {
  //     setUserNav(reduceNavLinks(rawLinks, permissions))
  //   }
  // }, [permissions])

  // console.log(userNav)

  //
  return (
    <nav
      type={type}
      className={cssClasses('Navigation', {
        'Navigation--vertical': type === 'vertical',
        'Navigation--horizontal': type === 'horizontal',
      })}
    >
      {rawLinks.map(link => (
        <ThemedLink
          {...link}
          history={history}
          location={location}
          onClick={onClick}
        />
      ))}
      {/* {userNav &&
        userNav.map(props =>
          makeThemedLink({
            ...props,
            history,
            location,
            onClick,
          })
        )} */}
      {children}
    </nav>
  )
}

export default LinkNavigation

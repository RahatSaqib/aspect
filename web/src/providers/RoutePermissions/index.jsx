import React, { createContext, useContext } from 'react'
import { useSelector } from 'react-redux'
import { matchPath } from 'react-router-dom'
import filter from 'lodash/filter'
import get from 'lodash/get'

import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'

const RoutesPermissionContext = createContext()

function extractPermissionsFromRoutes(routes, path) {
  let output = []
  if (routes.length) {
    const foundRoute = filter(
      routes,
      ({ props: { path: routePath = false } }) => routePath && matchPath(routePath, path)
    )
    if (foundRoute.length) {
      const permissions = get(foundRoute[0], 'props.element.props.permissions')
      if (permissions) {
        output = permissions
      }
    }
  }
  return output
}

function RoutesPermissionProvider({ children }) {
  const {
    props: { children: routes = [] },
  } = children

  const { permissions: userPermissions } = useSelector(({ user }) => user.toJS().jwt)

  return (
    <RoutesPermissionContext.Provider value={{ isPermitted: false, routes, userPermissions }}>
      {children}
    </RoutesPermissionContext.Provider>
  )
}

function useUserIsPermitted(path) {
  // const match = useRouteMatch()
  const context = useContext(RoutesPermissionContext)
  if (context === undefined) {
    throw new Error('useUserIsPermitted must be used within a RoutesPermissionProvider')
  }
  const { userPermissions, routes } = context
  const routePermissionsRequired = extractPermissionsFromRoutes(routes, path.replace(/[?|#].*/, ''))
  const allow = isPermittedUser(userPermissions, {
    required: routePermissionsRequired,
  })
  context.isPermitted = allow
  return context
}

export { RoutesPermissionProvider, useUserIsPermitted }

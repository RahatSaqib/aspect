import React, { memo, useState, useEffect } from 'react'
import constant from 'lodash/constant'
import flowRight from 'lodash/flowRight'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import noop from 'lodash/noop'
import PropTypes from 'prop-types'
import { useStore } from 'react-redux'

const MATCH_TYPE = {
  // exact match of the item in userPermissions (i.e. 'result:edit') and item in requestedPermissions (i.e. 'result:edit')
  EXACT: 'EXACT',
  // match of 'scope' part of user permission (i.e. 'result' from 'result:view') with item in requestedPermissions (i.e. 'result')
  SCOPE: 'SCOPE',
  // senior permission from userPermissions (i.e. 'result:edit') is greater than requested junior permission from requestedPermissions (i.e. 'result:view')
  NESTED: 'NESTED',
}

// Superiority of permission access levels
const NESTED_ACCESS_LEVELS_FOR = {
  // propName is a permission access level
  // array in propValue lists all access levels which are nested in propName
  // another words - propName is greater than any access level in propValue
  admin: ['view', 'edit'],
  edit: ['view'],
  view: [], // this is a minimal access level, so no any weaker
}

// Get a permissions list from the combination of permissionsInConfig (from HOC)
// and overriddenPermissions, extraPermissions that are passed in by props
export function getPermissions(permissionsInConfig, overriddenPermissions, extraPermissions) {
  const basePermissions = isEmpty(overriddenPermissions) ? permissionsInConfig : overriddenPermissions
  const permissions = basePermissions.concat(extraPermissions)
  return permissions
}

// Group a permissions list into different permission group:
// +name:activity => required
// !name:activity => forbidden
// name:activity => optional
export function groupByPermissionTypes(permissions) {
  const requiredPermissions = permissions.filter(it => it?.[0] === '+').map(it => it.substr(1))

  const forbiddenPermissions = permissions.filter(it => it?.[0] === '!').map(it => it.substr(1))

  const optionalPermissions = permissions.filter(it => it?.[0] !== '+' && it?.[0] !== '!')

  return {
    required: requiredPermissions,
    forbidden: forbiddenPermissions,
    optional: optionalPermissions,
  }
}
/**
 * Returns array of JSON objects with userPermissions found in array of requestedPermissions
 *
 * @param {Array(string)} userPermissions: from state.user.jwt.permissions
 * @param {Array(string)} requestedPermissions: array of requested permissions
 * @return an Array of JSON items
 *   {
 *     permission - string, this is an item from userPermissions
 *     matchType  - string, one of MATCH_TYPE values
 *     matchValue - string or array of strings
 *   }
 */
function getMatchedUserPermissions(userPermissions, requestedPermissions) {
  return userPermissions.reduce((acc, permission) => {
    // exact match of permission!
    if (requestedPermissions.includes(permission)) {
      return [
        ...acc,
        {
          permission,
          matchType: MATCH_TYPE.EXACT,
          matchValue: permission,
        },
      ]
    }
    // when permission is defined in-full with pattern 'Scope:Level' (i.e. 'result:view'),
    // then get it's parts and see if requestedPermissions asks for only Scope
    // or if user's Level is greater than requested one
    if (permission.includes(':')) {
      const [scope, level] = permission.split(':')

      // exact match of the scope!
      if (requestedPermissions.includes(scope)) {
        // only Scope is requested, meaning any Level is okay -
        // i.e. requestedPermissions = [..., 'task', ...] means that any 'task:*' in userPermissions is good
        return [
          ...acc,
          {
            permission,
            matchType: MATCH_TYPE.SCOPE,
            matchValue: scope,
          },
        ]
      }
      // see if user's Level is greater than requested Level
      const nestedLevels = NESTED_ACCESS_LEVELS_FOR[level]
      if (nestedLevels && isArray(nestedLevels) && nestedLevels.length > 0) {
        // assemble fully defined permissions from nested levels
        const nestedPermissions = nestedLevels.map(nestedLevel => `${scope}:${nestedLevel}`)

        // check if requestedPermissions contains nested permissions
        const matchedNestedPermissions = nestedPermissions.filter(nestedPermission =>
          requestedPermissions.includes(nestedPermission)
        )
        if (matchedNestedPermissions.length > 0) {
          return [
            ...acc,
            {
              permission,
              matchType: MATCH_TYPE.NESTED,
              // IMPORTANT - notice that in case of nested matching we store the array of all found
              // matches in matchValue, not a single string value
              matchValue: matchedNestedPermissions,
            },
          ]
        }
      }
    }
    return acc
  }, [])
}

// Given a user's permissions list, and a permission group (return type of groupByPermissionTypes),
// check if the user is allowed to the resource protected by the permission group
export function isPermittedUser(
  userPermissions,
  // see func groupByPermissionTypes() above for meaning of below 3 arrays
  { required = [], forbidden = [], optional = [] }
) {
  // treat resource access is allowed when no permissions requested
  if (required.length === 0 && forbidden.length === 0 && optional.length === 0) {
    return true
  }

  const cntMatches = requestedPerms => getMatchedUserPermissions(userPermissions, requestedPerms).length

  return (
    // ALL items in `required` must be found in userPermissions
    (required.length === 0 || cntMatches(required) >= required.length) &&
    // NO ONE item in `forbidden` must be found in userPermissions
    (forbidden.length === 0 || cntMatches(forbidden) === 0) &&
    // at least one item from `optional` must be found in userPermissions
    (optional.length === 0 || cntMatches(optional) > 0)
  )
}

// An HOC that can protect underlying resource with pre-config permissions list.
// The permissions can be overridden/added by
// props (overriddenPermissions, extraPermissions) as well.
export const requirePermissions = outerProps => WrappedComponent => {
  const PermissionResolver = props => {
    const store = useStore()
    const [userPermissions, setUserPermissions] = useState(store.getState().user.jwt.permissions)

    let unsubscribe = noop

    useEffect(() => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      unsubscribe = store.subscribe(handleStoreChange)
      return () => {
        unsubscribe()
        unsubscribe = noop
      }
    }, [])

    const handleStoreChange = () => {
      if (unsubscribe === noop) {
        return
      }
      setUserPermissions(store.getState().user.jwt.permissions)
    }

    const { permissions: permissionsInConfig = [], ForbiddenComponent = constant(false) } = outerProps
    const { overriddenPermissions = [], extraPermissions = [], ...restProps } = props
    const permissionsByTypes = flowRight([groupByPermissionTypes, getPermissions])(
      permissionsInConfig,
      overriddenPermissions,
      extraPermissions
    )
    const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)

    return isPermitted ? <WrappedComponent {...restProps} /> : <ForbiddenComponent {...restProps} />
  }

  PermissionResolver.propTypes = {
    overriddenPermissions: PropTypes.arrayOf(PropTypes.string),
    extraPermissions: PropTypes.arrayOf(PropTypes.string),
  }
  PermissionResolver.defaultProps = {
    overriddenPermissions: [],
    extraPermissions: [],
  }

  return memo(PermissionResolver) // <--- TODO: check with David regarding `memo`
}

export default requirePermissions

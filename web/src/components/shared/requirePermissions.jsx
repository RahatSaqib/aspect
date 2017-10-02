import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import getDisplayName from 'react-display-name'

// Get a permissions list from the combination of permissionsInConfig (from HOC)
// and overriddenPermissions, extraPermissions that are passed in by props
export function getPermissions(
  permissionsInConfig,
  overriddenPermissions,
  extraPermissions
) {
  const basePermissions = _.isEmpty(overriddenPermissions)
    ? permissionsInConfig
    : overriddenPermissions
  const permissions = basePermissions.concat(extraPermissions)
  return permissions
}

// Group a permissions list into different permission group:
// +name:activity => required
// !name:activity => forbidden
// name:activity => optional
export function groupByPermissionTypes(permissions) {
  const requiredPermissions = permissions
    .filter(it => it[0] === '+')
    .map(it => it.substr(1))

  const forbiddenPermissions = permissions
    .filter(it => it[0] === '!')
    .map(it => it.substr(1))

  const optionalPermissions = permissions.filter(
    it => it[0] !== '+' && it[0] !== '!'
  )

  return {
    required: requiredPermissions,
    forbidden: forbiddenPermissions,
    optional: optionalPermissions,
  }
}

// Given a user's permissions list, and a permission group (return type of groupByPermissionTypes),
// check if the user is allowed to the resource protected by the permission group
export function isPermittedUser(
  userPermissions,
  { required, forbidden, optional }
) {
  const isAllRequired =
    userPermissions.intersect(required).size === required.length

  const isNoForbidden = userPermissions.intersect(forbidden).size === 0

  const hasSomeOptional =
    _.isEmpty(optional) || userPermissions.intersect(optional).size > 0

  return isAllRequired && isNoForbidden && hasSomeOptional
}

// An HOC that can protect underlying resource with pre-config permissions list.
// The permissions can be overridden/added by
// props (overriddenPermissions, extraPermissions) as well.
export const requirePermissions = ({
  permissions: permissionsInConfig = [],
  ForbiddenComponent = _.constant(false),
}) => WrappedComponent =>
  class RequirePermissions extends PureComponent {
    static displayName = `requirePermissions(${getDisplayName(
      WrappedComponent
    )})`

    static propTypes = {
      overriddenPermissions: PropTypes.arrayOf(PropTypes.string),
      extraPermissions: PropTypes.arrayOf(PropTypes.string),
    }

    static defaultProps = {
      overriddenPermissions: [],
      extraPermissions: [],
    }

    static contextTypes = {
      store: PropTypes.object.isRequired,
    }

    state = this.createState()

    unsubscribe = _.noop // eslint-disable-line react/sort-comp

    handleStoreChange = () => {
      if (this.unsubscribe === _.noop) {
        return
      }
      this.setState(this.createState())
    }

    createState() {
      const { store } = this.context
      return {
        userPermissions: store.getState().user.jwt.permissions,
      }
    }

    componentWillMount() {
      this.unsubscribe = this.context.store.subscribe(this.handleStoreChange)
    }

    componentWillUnmount() {
      this.unsubscribe()
      this.unsubscribe = _.noop
    }

    render() {
      const {
        overriddenPermissions = [],
        extraPermissions = [],
        ...restProps
      } = this.props
      const { userPermissions } = this.state
      const permissionsByTypes = _.flowRight([
        groupByPermissionTypes,
        getPermissions,
      ])(permissionsInConfig, overriddenPermissions, extraPermissions)
      const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)

      return isPermitted ? (
        <WrappedComponent {...restProps} />
      ) : (
        <ForbiddenComponent />
      )
    }
  }

export default requirePermissions

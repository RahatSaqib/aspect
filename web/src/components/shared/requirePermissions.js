import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import getDisplayName from 'react-display-name'

export function getPermissions(permissionsInConfig, overriddenPermissions, extraPermissions) {
  const basePermissions = _.isEmpty(overriddenPermissions) ? permissionsInConfig : overriddenPermissions
  const permissions = basePermissions.concat(extraPermissions)
  return permissions
}

export function groupByPermissionTypes(permissions) {
  const requiredPermissions = permissions
    .filter(it => it[0] === '+')
    .map(it => it.substr(1))

  const forbiddenPermissions = permissions
    .filter(it => it[0] === '!')
    .map(it => it.substr(1))

  const optionalPermissions = permissions
    .filter(it => it[0] !== '+' && it[0] !== '!')

  return {
    required: requiredPermissions,
    forbidden: forbiddenPermissions,
    optional: optionalPermissions
  }
}

export function isPermittedUser(userPermissions, { required, forbidden, optional }) {
  const isAllRequired = required
    .every(it => userPermissions.indexOf(it) !== -1)

  const isNoForbidden = forbidden
    .every(it => userPermissions.indexOf(it) === -1)

  const hasSomeOptional = _.isEmpty(optional) || optional
    .some(it => userPermissions.indexOf(it) !== -1)

  return isAllRequired && isNoForbidden && hasSomeOptional
}

export const requirePermissions = ({ permissions: permissionsInConfig = [], ForbiddenComponent = _.constant(false) }) => WrappedComponent => (
  class RequirePermissions extends PureComponent {
    static displayName = `requirePermissions(${getDisplayName(WrappedComponent)})`

    static propTypes = {
      overriddenPermissions: PropTypes.arrayOf(PropTypes.string),
      extraPermissions: PropTypes.arrayOf(PropTypes.string)
    }

    static contextTypes = {
      store: PropTypes.object.isRequired
    }

    state = this.createState()

    unsubscribe = _.noop

    handleStoreChange = () => {
      this.setState(this.createState())
    }

    createState() {
      const { store } = this.context
      return {
        userPermissions: store.getState().getIn(['user', 'permissions'])
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
      const { overriddenPermissions = [], extraPermissions = [], ...restProps } = this.props
      const { userPermissions } = this.state
      const permissionsByTypes = _.flowRight([
        groupByPermissionTypes,
        getPermissions
      ])(permissionsInConfig, overriddenPermissions, extraPermissions)
      const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)

      return (
        isPermitted ? <WrappedComponent {...restProps} /> : <ForbiddenComponent />
      )
    }
  }
)

export default requirePermissions

import React, { Fragment, memo } from 'react'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import { getPermissions, groupByPermissionTypes, isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../AuthProvider'

export const isGraphPermitted = ({
  auth,
  permissions: permissionsInConfig,
  override: overriddenPermissions = [],
  extra: extraPermissions = [],
}) => {
  const {
    jwt: { permissions },
  } = auth
  const permissionsByTypes = flowRight([groupByPermissionTypes, getPermissions])(
    permissionsInConfig,
    overriddenPermissions,
    extraPermissions
  )
  const isPermitted = isPermittedUser(permissions, permissionsByTypes)
  return isPermitted
}

const PermissionsProvider = ({ permissions, override, extra, children }) => {
  const auth = useAuthState()
  const isPermitted = isGraphPermitted({
    auth,
    permissions,
    override,
    extra,
  })
  return isPermitted ? <Fragment>{children}</Fragment> : null
}

PermissionsProvider.defaultProps = {
  override: [],
  extra: [],
  children: null,
}

PermissionsProvider.propTypes = {
  permissions: PropTypes.oneOfType([PropTypes.array]).isRequired,
  override: PropTypes.oneOfType([PropTypes.array]),
  extra: PropTypes.oneOfType([PropTypes.array]),
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
}

export default memo(PermissionsProvider)

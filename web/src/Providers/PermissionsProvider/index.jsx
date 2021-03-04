import React, { Fragment, memo } from 'react'
import PropTypes from 'prop-types'
import flowRight from 'lodash/flowRight'

import { useAuthState } from '../AuthProvider'

import {
  getPermissions,
  groupByPermissionTypes,
  isPermittedUser,
} from '../../components/shared/requirePermissions'

const PermissionsProvider = ({
  permissions: permissionsInConfig,
  override: overriddenPermissions,
  extra: extraPermissions,
  children,
}) => {
  const {
    jwt: { permissions },
  } = useAuthState()
  const permissionsByTypes = flowRight([
    groupByPermissionTypes,
    getPermissions,
  ])(permissionsInConfig, overriddenPermissions, extraPermissions)
  const isPermitted = isPermittedUser(permissions, permissionsByTypes)
  return isPermitted ? <Fragment>{children}</Fragment> : null
}

PermissionsProvider.defaultProps = {
  override: [],
  extra: [],
}

PermissionsProvider.propTypes = {
  permissions: PropTypes.oneOfType([PropTypes.array]).isRequired,
  override: PropTypes.oneOfType([PropTypes.array]),
  extra: PropTypes.oneOfType([PropTypes.array]),
  children: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default memo(PermissionsProvider)

import React, { Fragment, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import flowRight from 'lodash/flowRight'

import {
  getPermissions,
  groupByPermissionTypes,
  isPermittedUser,
} from '../../components/shared/requirePermissions'

const PermissionsProvider = ({
  permissions: permissionsInConfig,
  override: overriddenPermissions = [],
  extra: extraPermissions = [],
  children,
}) => {
  const { permissions } = useSelector(({ user }) => user.toJS().jwt)
  const permissionsByTypes = flowRight([
    groupByPermissionTypes,
    getPermissions,
  ])(permissionsInConfig, overriddenPermissions, extraPermissions)
  const isPermitted = isPermittedUser(permissions, permissionsByTypes)
  return isPermitted ? <Fragment>{children}</Fragment> : null
}

export default PermissionsProvider

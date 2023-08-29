import React from 'react'
import PermissionChecker from '../components/PermissionChecker'

export default function withPermission(WrappedComponent, permissions) {
  return function WithPermissionComponent(props) {
    return (
      <PermissionChecker permissions={permissions}>
        <WrappedComponent {...props} />
      </PermissionChecker>
    )
  }
}

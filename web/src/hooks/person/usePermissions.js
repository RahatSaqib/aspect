import flowRight from 'lodash/flowRight'
import { getPermissions, groupByPermissionTypes, isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'

export default function usePermissions() {
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  const checkPermission = (permissions, override, extra) => {
    const permissionsByTypes = flowRight([groupByPermissionTypes, getPermissions])(permissions, override, extra)
    return isPermittedUser(userPermissions, permissionsByTypes)
  }
  return { checkPermission }
}

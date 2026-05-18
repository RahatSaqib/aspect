import flowRight from 'lodash/flowRight'
import { getPermissions, groupByPermissionTypes, isPermittedUser } from '../../components/shared/requirePermissions'
import useAuthState from '../useAuthState'

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

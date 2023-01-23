import { memo } from 'react'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import { getPermissions, groupByPermissionTypes, isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'

const PermissionChecker = ({ permissions, override, extra, children }) => {
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const permissionsByTypes = flowRight([groupByPermissionTypes, getPermissions])(permissions, override, extra)
  const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)

  return isPermitted ? children : null
}

PermissionChecker.defaultProps = {
  override: [],
  extra: [],
}

PermissionChecker.propTypes = {
  permissions: PropTypes.oneOfType([PropTypes.array]).isRequired,
  override: PropTypes.oneOfType([PropTypes.array]),
  extra: PropTypes.oneOfType([PropTypes.array]),
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
}

export default memo(PermissionChecker)

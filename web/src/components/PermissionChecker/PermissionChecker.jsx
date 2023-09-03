import { memo } from 'react'
import PropTypes from 'prop-types'
import usePermissions from '../../hooks/person/usePermissions'

const PermissionChecker = ({ permissions, override, extra, children }) => {
  const { checkPermission } = usePermissions()
  const isPermitted = checkPermission(permissions, override, extra)
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

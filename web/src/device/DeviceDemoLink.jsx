// Imports from packages
import { Link } from 'react-router'

import requirePermissions from '../components/shared/requirePermissions'

const DeviceDemoLink = requirePermissions({
  permissions: ['demo:admin']
})(Link)

export default DeviceDemoLink

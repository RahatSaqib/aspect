// Imports from packages
import { Link } from 'react-router-dom'

import requirePermissions from '../components/shared/requirePermissions'

const DeviceDemoLink = requirePermissions({
  permissions: ['demo:edit'],
})(Link)

export default DeviceDemoLink

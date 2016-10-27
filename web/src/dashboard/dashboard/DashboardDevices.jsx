// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

export class DashboardDevices extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired
  }

  render() {
    const { label } = this.props

    return (
      <Link to="/device">
        <MiniChart
          data={[1, 8, 15, 40, 45, 80, 90, 155]}
          label={label}
          number={155}
          bgcolor={'#00bcd4'}
        />
      </Link>
    )
  }
}

export default requirePermissions({
  permissions: ['device:admin', 'device:view']
})(DashboardDevices)

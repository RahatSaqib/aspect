// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

export class DashboardSites extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired
  }

  render() {
    const { label } = this.props

    return (
      <Link to="/site">
        <MiniChart
          data={[10, 19, 15, 40, 45, 80, 90, 22]}
          label={label}
          number={8}
          bgcolor={'#24c821'}
        />
      </Link>
    )
  }
}

export default requirePermissions({
  permissions: ['site:admin', 'site:view']
})(DashboardSites)

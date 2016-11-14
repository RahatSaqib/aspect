// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

export class DashboardInventory extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired
  }

  render() {
    const { label } = this.props

    return (
      <Link to="/inventory">
        <MiniChart  data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
                    label={label} number={1456} bgcolor={'#607d8b'} />
      </Link>
    )
  }
}

export default requirePermissions({
  permissions: ['inventory:admin', 'inventory:view']
})(DashboardInventory)

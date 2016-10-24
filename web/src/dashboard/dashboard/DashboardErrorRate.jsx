// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

export class DashboardErrorRate extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired
  }

  render() {
    const { label } = this.props

    return (
      <Link to="/result">
        <MiniChart
          data={[25, 12, 8, 2, 1]}
          label={label}
          number={'12'}
          bgcolor={'#ff9800'}
        />
      </Link>
    )
  }
}

export default requirePermissions({
  permissions: ['result:admin', 'result:view']
})(DashboardErrorRate)

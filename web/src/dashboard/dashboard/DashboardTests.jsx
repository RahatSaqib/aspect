// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

export class DashboardTests extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired
  }

  render() {
    const { label } = this.props

    return (
      <Link to="/result">
        <MiniChart
          data={[1000, 2000, 4000, 10000, 5000, 50000, 100000, 120000, 110000]}
          label={label}
          number={125459}
          bgcolor={'#8bc34a'}
        />
      </Link>
    )
  }
}

export default requirePermissions({
  permissions: ['result:admin', 'result:view']
})(DashboardTests)

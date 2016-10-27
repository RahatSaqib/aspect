// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

export class DashboardContacts extends PureComponent {
  static propTypes = {
    label: PropTypes.string.isRequired
  }

  render() {
    const { label } = this.props

    return (
      <Link to="/person">
        <MiniChart
          data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
          label={label}
          number={12}
          bgcolor={'#FBC02D'}
        />
      </Link>
    )
  }
}

export default requirePermissions({
  permissions: ['person:admin', 'person:view']
})(DashboardContacts)

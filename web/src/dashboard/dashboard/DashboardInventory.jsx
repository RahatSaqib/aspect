// Imports from packages
import React, { PropTypes } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Link } from 'react-router'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

const enhance = compose(
  setPropTypes({
    label: PropTypes.string.isRequired
  }),
  pure,
  requirePermissions({
    permissions: ['inventory:admin', 'inventory:view']
  })
)

export const DashboardInventory = ({ label }) => (
  <Link to="/inventory">
    <MiniChart
      data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
      label={label}
      number={1456}
      bgcolor="#607d8b"
    />
  </Link>
)

export default enhance(DashboardInventory)

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
    permissions: ['result:admin', 'result:view']
  })
)

export const DashboardTests = ({ label }) => (
  <Link to="/result">
    <MiniChart
      data={[1000, 2000, 4000, 10000, 5000, 50000, 100000, 120000, 110000]}
      label={label}
      number={125459}
      bgcolor={'#8bc34a'}
    />
  </Link>
)

export default enhance(DashboardTests)

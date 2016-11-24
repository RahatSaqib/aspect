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

export const DashboardErrorRate = ({ label }) => (
  <Link to="/result">
    <MiniChart
      data={[25, 12, 8, 2, 1]}
      label={label}
      number={'12'}
      bgcolor={'#ff9800'}
    />
  </Link>
)

export default enhance(DashboardErrorRate)

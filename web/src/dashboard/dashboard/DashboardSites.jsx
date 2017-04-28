import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Link } from 'react-router-dom'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import MiniChart from '../../components/shared/MiniChart'

const enhance = compose(
  setPropTypes({
    label: PropTypes.string.isRequired,
  }),
  pure,
  requirePermissions({
    permissions: ['site:admin', 'site:view'],
  }),
)

export const DashboardSites = ({ label }) => (
  <Link to="/site">
    <MiniChart
      data={[10, 19, 15, 40, 45, 80, 90, 22]}
      label={label}
      number={8}
      bgcolor={'#24c821'}
    />
  </Link>
)

export default enhance(DashboardSites)

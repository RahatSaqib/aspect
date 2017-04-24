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
    permissions: ['device:admin', 'device:view'],
  }),
)

export const DashboardDevices = ({ label }) => (
  <Link to="/device">
    <MiniChart
      data={[1, 8, 15, 40, 45, 80, 90, 155]}
      label={label}
      number={155}
      bgcolor={'#00bcd4'}
    />
  </Link>
)

export default enhance(DashboardDevices)

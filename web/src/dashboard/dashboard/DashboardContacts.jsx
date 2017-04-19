import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
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
    permissions: ['person:admin', 'person:view']
  })
)

export const DashboardContacts = ({ label }) => (
  <Link to="/person">
    <MiniChart
      data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
      label={label}
      number={12}
      bgcolor={'#FBC02D'}
    />
  </Link>
)

export default enhance(DashboardContacts)

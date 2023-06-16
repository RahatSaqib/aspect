import React from 'react'
import { Link } from 'react-router-dom'
import DataRow from './DataRow'

const DashboardLink = ({ label, value, to }) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <DataRow label={to ? label : `${label} (Pending)`} value={value} />
    </Link>
  )
}

export default DashboardLink

import React from 'react'
import { Link } from 'react-router-dom'
import DataRow from './DataRow'

const DashboardLink = ({ label, value, to, disabled }) => {
  const linkProps = disabled
    ? {
        to: '',
        style: { textDecoration: 'none', color: 'darkgrey', cursor: 'default' },
      }
    : {
        to,
        style: { textDecoration: 'none' },
      }
  return (
    <Link {...linkProps}>
      <DataRow label={label} value={value} />
    </Link>
  )
}

export default DashboardLink

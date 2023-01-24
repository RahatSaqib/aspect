import React from 'react'
import { Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

const DashboardLink = ({ label, value, to }) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 14 }}>{label}</Typography>
        <Typography sx={{ fontSize: 24, color: '#009688' }}>{value}</Typography>
      </Stack>
    </Link>
  )
}

export default DashboardLink

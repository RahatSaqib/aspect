import React from 'react'
import { Stack, Typography, Divider } from '@mui/material'

const DataRow = ({ label, value }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ fontSize: 14 }}>{label}</Typography>
      <Divider orientation="vertical" />
      <Typography sx={{ fontSize: 24, color: '#009688' }}>{value}</Typography>
    </Stack>
  )
}

export default DataRow

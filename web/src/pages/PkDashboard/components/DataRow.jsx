import React from 'react'
import { Stack, Typography, Divider } from '@mui/material'

const DataRow = ({ label, value }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ fontSize: 16, fontWeight: 500 }}>{label}</Typography>
      {value ? (
        <>
          <Divider />
          <Typography sx={{ fontSize: 32, color: '#009688' }}>{value}</Typography>
        </>
      ) : null}
    </Stack>
  )
}

export default DataRow

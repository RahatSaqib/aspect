import React from 'react'
import { Grid, Stack } from '@mui/material'
import DataRow from './DataRow'

const TripleCardSide = ({ data }) => {
  return (
    <Grid item xs={12} md={4} lg={4} sx={{ backgroundColor: '#f0f0f0', p: 2, borderRadius: 5 }}>
      <Stack direction="column" justifyContent="space-evenly" alignItems="strech" sx={{ height: '100%' }}>
        {data.map(item => (
          <DataRow label={item.label} value={item.value} />
        ))}
      </Stack>
    </Grid>
  )
}

export default TripleCardSide

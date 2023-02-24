import React from 'react'
import { Grid, Stack } from '@mui/material'
import DataRow from './DataRow'

const TripleCardSide = ({ data }) => {
  return (
    <Grid item xs={12} md={4} lg={4} sx={{ p: 1 }}>
      <Stack
        direction="column"
        justifyContent="space-evenly"
        alignItems="strech"
        sx={{ backgroundColor: '#f0f0f0', height: '100%', borderRadius: 5, p: 2 }}
      >
        {data.map((item, i) => (
          <DataRow key={i} label={item.label} value={item.value} />
        ))}
      </Stack>
    </Grid>
  )
}

export default TripleCardSide

import React from 'react'
import { Grid, Stack, useTheme } from '@mui/material'
import DataRow from './DataRow'

const TripleCardSide = ({ data }) => {
  const { palette } = useTheme()
  return (
    <Grid item xs={12} md={4} lg={4} sx={{ p: 1 }}>
      <Stack direction="column" justifyContent="space-evenly" alignItems="strech">
        {data.map((item, i) => (
          <DataRow
            sx={{ height: '100%', borderRadius: 5, my: '15px', border: `1px solid ${palette.divider}`, p: 2 }}
            key={i}
            label={item.label}
            value={item.value}
          />
        ))}
      </Stack>
    </Grid>
  )
}

export default TripleCardSide

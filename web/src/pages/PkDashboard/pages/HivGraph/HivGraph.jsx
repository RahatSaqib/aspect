import React, { useMemo } from 'react'
import { Container, Grid } from '@mui/material'
import { useSelector } from 'react-redux'
import HivResultsGraph from '../../../../oldPages/dashboard/Graphs/HivResultsGraph'

const HivGraphPage = () => {
  const assaysImmutable = useSelector(({ assay }) => assay.items)
  const assays = useMemo(() => assaysImmutable.toJS(), [assaysImmutable])

  return (
    <Container maxWidth>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} style={{ padding: '16px 8px 0' }}>
          <HivResultsGraph assaysFromState={assays} />
        </Grid>
      </Grid>
    </Container>
  )
}

export default HivGraphPage

import React, { useMemo } from 'react'
import { Container, Grid } from '@mui/material'
import { useSelector } from 'react-redux'
import CovidResultGraph from '../../../../oldPages/dashboard/Graphs/CovidResultGraph'

const CovidGraphPage = () => {
  const assaysImmutable = useSelector(({ assay }) => assay.items)
  const assays = useMemo(() => assaysImmutable.toJS(), [assaysImmutable])

  return (
    <Container maxWidth sx={{ pb: 3, maxHeight: 'calc(100vh - 64px)', overflow: 'scroll' }}>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} style={{ padding: '16px 8px 0' }}>
          <CovidResultGraph assaysFromState={assays} />
        </Grid>
      </Grid>
    </Container>
  )
}

export default CovidGraphPage

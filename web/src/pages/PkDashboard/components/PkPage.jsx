import React from 'react'
import { Container, Grid, Card, CardContent, Stack } from '@mui/material'
import DetailHeader from '../../../components/DetailHeader'
import useDocumentTitle from '../../../hooks/useDocumentTitle'

const containerStyle = {
  pb: 3,
  paddingLeft: '8px !important',
  paddingRight: '8px !important',
  height: 'calc(100vh - 128px)',
  overflow: 'auto',
}
const gridStyle = { padding: '16px 8px 0' }
const filterStyle = { width: '50%', float: 'right' }

const PkPage = ({ title, filters, filter, children }) => {
  useDocumentTitle(`${title} - Aspect`) // no need for helmet
  return (
    <>
      <DetailHeader name={title} />
      <Container maxWidth sx={containerStyle}>
        <Grid container spacing={2}>
          <Grid item xs={12} style={gridStyle}>
            <Card>
              <CardContent>
                {filters ? (
                  <Stack direction="row" spacing={2}>
                    {filters}
                  </Stack>
                ) : null}
                {filter ? <div style={filterStyle}>{filter}</div> : null}
                {children}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default PkPage

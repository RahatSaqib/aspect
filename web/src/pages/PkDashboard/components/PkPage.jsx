import React from 'react'
import { Container, Grid, Card, CardContent, Stack } from '@mui/material'
import DetailHeader from '../../../components/DetailHeader'
import useDocumentTitle from '../../../hooks/useDocumentTitle'

const containerStyle = { pb: 3, paddingLeft: '8px !important', paddingRight: '8px !important', overflow: 'auto' }
const normalHeight = { height: 'calc(100vh - 128px)' }
const fullHeight = { height: 'calc(100vh - 64px)' }
const gridStyle = { padding: '16px 8px 0' }
const filterStyle = { width: '50%', float: 'right' }

const PkPage = ({ title, filters, filter, children, full }) => {
  useDocumentTitle(`${title} - Aspect`) // no need for helmet
  return (
    <>
      <DetailHeader name={title} disableBack={full} />
      <Container maxWidth sx={full ? { ...containerStyle, ...fullHeight } : { ...containerStyle, ...normalHeight }}>
        {full ? (
          children
        ) : (
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
        )}
      </Container>
    </>
  )
}

export default PkPage

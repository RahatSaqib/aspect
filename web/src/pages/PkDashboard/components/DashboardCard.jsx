import React from 'react'
import { Card, CardHeader, CardContent } from '@mui/material'

const DashboardCard = ({ title, children }) => {
  return (
    <Card sx={{ mb: 1 }}>
      {title ? <CardHeader subheader={title} sx={{ pb: 0 }} /> : null}
      <CardContent sx={{ p: 2, pb: '16px !important' }}>{children}</CardContent>
    </Card>
  )
}

export default DashboardCard

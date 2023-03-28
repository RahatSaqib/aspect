import React from 'react'
import { Card, CardHeader } from '@mui/material'

const ColumnName = ({ title }) => (
  <Card sx={{ mb: 1 }}>
    <CardHeader title={title} sx={{ p: 1 }} />
  </Card>
)

export default ColumnName

import React from 'react'
import { CircularProgress, Paper } from '@mui/material'

const wrapperStyle = { padding: '6px 0' }

const cardStyle = {
  height: '100%',
  width: '100%',
  minHeight: '500px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '24px',
  boxSizing: 'border-box',
}

const LoadingCard = () => (
  <div style={wrapperStyle}>
    <Paper style={cardStyle}>
      <CircularProgress />
    </Paper>
  </div>
)

export default LoadingCard

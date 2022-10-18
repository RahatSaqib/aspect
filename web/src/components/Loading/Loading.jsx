import React from 'react'
import { CircularProgress } from '@mui/material'

const Loading = () => (
  <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <CircularProgress />
  </div>
)

export default Loading

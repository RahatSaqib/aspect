import React from 'react'
import { CircularProgress } from '@mui/material'

const loadingStyle = { height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }

const Loading = ({ centered }) => (
  <div style={centered ? { ...loadingStyle, height: '100vh', width: '100%' } : loadingStyle}>
    <CircularProgress />
  </div>
)

export default Loading

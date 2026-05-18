import React from 'react'
import { CircularProgress } from '@mui/material'

const loadingStyle = { height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }

const Loading = ({ centered, level = 0 }) => (
  <div
    style={
      centered
        ? {
            ...loadingStyle,
            height: level === 2 ? 'calc(100vh - 128px)' : level === 1 ? 'calc(100vh - 64px)' : '100vh',
            width: '100%',
          }
        : loadingStyle
    }
  >
    <CircularProgress />
  </div>
)

export default Loading

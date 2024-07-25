import React from 'react'
import { TableContainer as MuiTableContainer } from '@mui/material'

export function TableContainer({ sx, ...rest }) {
  return (
    <MuiTableContainer
      sx={theme => ({
        [theme.breakpoints.down('lg')]: {
          maxHeight: '350px',
        },
        ...(typeof sx === 'function' ? sx(theme) : sx),
      })}
      {...rest}
    />
  )
}

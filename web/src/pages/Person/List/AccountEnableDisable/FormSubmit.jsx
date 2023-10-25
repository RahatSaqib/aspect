import React from 'react'
import { Button } from '@mui/material'

const FormAction = ({ label, color, action, sx }) => {
  return (
    <Button color={color} variant="contained" onClick={e => action(e)} sx={sx}>
      {label}
    </Button>
  )
}

export { FormAction }

import React from 'react'
import Button from '@mui/material/Button'

const FormSubmit = ({ label, type, color, action, formik }) => {
  const { isValid, isSubmitting } = formik
  return (
    <Button
      type={type}
      color={color}
      variant="contained"
      onClick={e => action(e, formik)}
      disabled={!isValid || isSubmitting}
      sx={{ marginRight: '10px' }}
    >
      {label}
    </Button>
  )
}

const FormAction = ({ label, color, action, sx }) => {
  return (
    <Button color={color} variant="contained" onClick={e => action(e)} sx={sx}>
      {label}
    </Button>
  )
}

export { FormSubmit, FormAction }

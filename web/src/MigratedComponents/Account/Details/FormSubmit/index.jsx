import React from 'react'
import Button from '@material-ui/core/Button'

const FormSubmit = ({ label, type, color, action, formik }) => {
  const { isValid, isSubmitting } = formik
  return (
    <Button
      type={type}
      color={color}
      variant="contained"
      onClick={e => action(e, formik)}
      disabled={!isValid || isSubmitting}
    >
      {label}
    </Button>
  )
}

export default FormSubmit

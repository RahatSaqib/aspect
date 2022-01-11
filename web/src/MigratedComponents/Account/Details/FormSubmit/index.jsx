import React from 'react'
import Button from '@material-ui/core/Button'
import isEmpty from 'lodash/isEmpty'

const FormSubmit = ({ label, type, color, action, formik }) => {
  const { touched, isValid, isSubmitting } = formik
  return (
    <Button
      type={type}
      color={color}
      variant="contained"
      onClick={e => action(e, formik)}
      disabled={isEmpty(touched) || !isValid || isSubmitting}
    >
      {label}
    </Button>
  )
}

export default FormSubmit

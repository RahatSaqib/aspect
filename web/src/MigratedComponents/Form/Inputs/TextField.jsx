import React from 'react'
import TextField from '@material-ui/core/TextField'

import FormHTMLLabel from '../FormHTMLLabel'
import { getFieldErrorProps } from '../Formik/Helpers'
import { useFormikState } from '../Formik/Context'

const AspectTextField = ({ formik, label, link, ...rest }) => {
  const { updateField } = useFormikState()
  const onChangeLocal = event => {
    updateField(rest.id, event.target.value, formik)
  }

  return (
    <TextField
      {...rest}
      label={<FormHTMLLabel label={label} link={link} />}
      onChange={onChangeLocal}
      {...getFieldErrorProps(formik, rest.id)}
    />
  )
}

export default AspectTextField

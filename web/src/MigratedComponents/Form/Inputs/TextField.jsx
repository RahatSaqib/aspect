import React from 'react'
import TextField from '@material-ui/core/TextField'
import { useFormikContext } from 'formik'

import FormHTMLLabel from '../FormHTMLLabel'
import { getFieldErrorProps } from '../Formik/Helpers'

const AspectTextField = ({
  formik,
  label,
  link,
  /**
   * below props are not used - need then to free `rest`
   */
  classNames,
  controlType,
  validate,
  ...rest
}) => {
  const { updateField } = useFormikContext()
  const onChangeLocal = event => {
    updateField(rest.id, event.target.value, formik)
  }

  return (
    <TextField
      {...rest}
      label={link ? <FormHTMLLabel label={label} link={link} /> : label}
      onChange={onChangeLocal}
      {...getFieldErrorProps(formik, rest.id)}
    />
  )
}

export default AspectTextField

import React from 'react'
import PropTypes from 'prop-types'
import TextField from '@mui/material/TextField'
import { useFormikContext } from 'formik'

import FormHTMLLabel from '../FormHTMLLabel'
import { getFieldErrorProps } from '../Formik/Helpers'

const AspectTextField = ({
  controlType: { rowsMax, rows } = {},
  formik,
  label,
  link,
  multiline,
  /**
   * below props are not used - need then to free `rest`
   */
  classNames,
  validate,
  ...rest
}) => {
  const { updateField, toggleEdit } = useFormikContext()
  const onChangeLocal = event => {
    updateField(rest.id, event.target.value, { formik, toggleEdit })
  }

  return (
    <TextField
      {...rest}
      label={!multiline && link ? <FormHTMLLabel label={label} link={link} /> : label}
      multiline={multiline}
      onChange={onChangeLocal}
      {...getFieldErrorProps(formik, rest.id)}
      // props which takes effect when `multiline` is `true`
      maxRows={rowsMax}
      minRows={rows}
    />
  )
}

AspectTextField.defaultProps = {
  classNames: null,
  link: false,
  multiline: false,
  validate: null,
}

AspectTextField.propTypes = {
  controlType: PropTypes.oneOfType([PropTypes.object]).isRequired,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  label: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  link: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  multiline: PropTypes.bool,
  /**
   * below props are not used - need them to free `rest`
   */
  classNames: PropTypes.oneOfType([PropTypes.object]),
  validate: PropTypes.func,
}

export default AspectTextField

import React from 'react'
import { TextField } from '@mui/material'
import { useFormikContext } from 'formik'
import PropTypes from 'prop-types'
import { getFieldErrorProps } from '../Formik/Helpers'

const AspectNumberField = ({
  controlType,
  formik,
  label,
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
      label={label}
      onChange={onChangeLocal}
      {...getFieldErrorProps(formik, rest.id)}
      type="number"
      InputProps={{
        ...rest.InputProps,
        inputProps: {
          ...rest.InputProps.inputProps,
          min: controlType.min,
          max: controlType.max,
          inputMode: 'numeric',
          pattern: '[1-9]d*',
        },
      }}
    />
  )
}

AspectNumberField.defaultProps = {
  classNames: null,
  validate: null,
}

AspectNumberField.propTypes = {
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  label: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  controlType: PropTypes.oneOfType([PropTypes.object]).isRequired,
  /**
   * below props are not used - need them to free `rest`
   */
  classNames: PropTypes.oneOfType([PropTypes.object]),
  validate: PropTypes.func,
}

export default AspectNumberField

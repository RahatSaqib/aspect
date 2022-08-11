import React from 'react'
import TextField from '@mui/material/TextField'
import startCase from 'lodash/startCase'

/**
 * this component should not contain **ANY**
 * new styles, logic or functions
 * Applicable types: text, password, email, and textarea
 */

const PureTextInput = props => {
  const { inputProps, form } = props
  const { id, label, type, variant, rows = 4 } = inputProps
  const { errors, touched, handleBlur, handleChange, values } = form
  const isMultiLine = type === 'textarea'
  return (
    <TextField
      fullWidth
      id={id}
      name={id}
      label={label || startCase(id)}
      type={type}
      multiline={isMultiLine}
      rows={isMultiLine ? rows : 1}
      variant={variant || 'standard'}
      value={values[id] || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      error={touched[id] && Boolean(errors[id])}
      helperText={touched[id] && errors[id]}
      inputProps={{
        ...inputProps,
        autoComplete: `text-${id}`,
      }}
    />
  )
}

export default PureTextInput

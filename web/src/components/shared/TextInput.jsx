import React from 'react'
import { Field } from 'redux-form/immutable'
import Input from 'react-toolbox/lib/input'

const renderTextField = props => {
  const { input, meta, textFieldProps } = props
  const { touched, error } = meta
  const { theme } = textFieldProps
  return (
    <Input
      {...input}
      error={touched && error}
      {...textFieldProps}
      theme={theme}
    />
  )
}

const renderFormField = props => {
  const {
    name,
    label,
    autoFocus,
    style,
    disabled,
    maxLength,
    multiline,
    rows,
    type,
    onChange,
    onKeyPress,
    theme,
  } = props
  const textFieldProps = {
    label,
    autoFocus,
    style,
    disabled,
    maxLength,
    multiline,
    rows,
    type: type || 'text',
    theme,
  }
  if (onChange) {
    textFieldProps.onChange = onChange
  }
  if (onKeyPress) {
    textFieldProps.onKeyPress = onKeyPress
  }
  return (
    <Field
      name={name}
      textFieldProps={textFieldProps}
      component={renderTextField}
    />
  )
}

export default renderFormField

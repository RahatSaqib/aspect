import React from 'react'
import { Field } from 'redux-form/immutable'
import Input from 'react-toolbox/lib/input'
import styles from './Shared.css'

const renderTextField = props => {
  const { input, meta, textFieldProps } = props
  const { touched, error } = meta
  return (
    <Input
      {...input}
      errorStyle={{
        float: 'left',
        whiteSpace: 'nowrap',
        textOverflow: 'visible',
      }}
      error={touched && error}
      {...textFieldProps}
      theme={{
        input: styles.Form__Field,
      }}
    />
  )
}

const renderFormField = props => {
  const {
    name,
    label,
    fullWidth,
    autoFocus,
    style,
    inputStyle,
    disabled,
    maxLength,
    multiLine,
    rows,
    type,
    onChange,
    onKeyPress,
  } = props
  const textFieldProps = {
    label,
    fullWidth,
    autoFocus,
    style,
    inputStyle,
    disabled,
    maxLength,
    multiLine,
    rows,
    type: type || 'text',
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

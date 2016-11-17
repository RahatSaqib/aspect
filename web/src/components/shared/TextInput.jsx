import React from 'react'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'
import styles from './Shared.css'

const renderTextField = (props) => {
  const { input, meta, textFieldProps } = props
  const { touched, error } = meta
  return (<TextField
    {...input} errorStyle={{ float: 'left' }}
    errorText={touched && error} {...textFieldProps}
    className={textFieldProps.fullWidth ? '' : styles.Form__Field}
  />)
}

const renderFormField = (props) => {
  const {
    name,
    label,
    fullWidth,
    autoFocus,
    disabled,
    maxLength,
    type,
    onChange,
    onKeyPress } = props
  const textFieldProps = {
    floatingLabelText: label,
    fullWidth,
    autoFocus,
    disabled,
    maxLength,
    type: type || 'text'
  }
  if (onChange) {
    textFieldProps.onChange = onChange
  }
  if (onKeyPress) {
    textFieldProps.onKeyPress = onKeyPress
  }
  return <Field name={name} textFieldProps={textFieldProps} component={renderTextField} />
}

export default renderFormField

import React from 'react'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'
import classNames from 'classnames'
import styles from './Shared.css'

const renderTextField = props => {
  const { input, meta, textFieldProps } = props
  const { touched, error } = meta
  return (
    <TextField
      {...input}
      errorStyle={{
        float: 'left',
        whiteSpace: 'nowrap',
        textOverflow: 'visible',
      }}
      errorText={touched && error}
      {...textFieldProps}
      className={classNames({ [styles.Form__Field]: textFieldProps.fullWidth })}
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
    floatingLabelText: label,
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

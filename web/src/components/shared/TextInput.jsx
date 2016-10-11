import React from 'react'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'
import styles from './Shared.css'

const renderTextField = props => {
  const {input, meta, textFieldProps} = props,
    {touched, error} = meta
  return <TextField {...input} errorStyle={{ float: 'left' }}
             errorText={touched && error} {...textFieldProps} className={styles.Form__Field} />
}

const renderFormField = props => {
  const {name, label, fullWidth, disabled, maxLength} = props
  return <Field name={name} textFieldProps={{
    floatingLabelText: label,
    fullWidth: fullWidth,
    disabled: disabled,
    maxLength: maxLength
  }} component={renderTextField} />
}

export default renderFormField

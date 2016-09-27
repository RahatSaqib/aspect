import React from 'react'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'

const renderTextField = props =>
  <TextField {...props.input} errorStyle={{ float: 'left' }}
             errorText={props.meta.touched && props.meta.error}
             {...props.textFieldProps} />

const renderFormField = props =>
  <Field name={props.name} textFieldProps={{
    floatingLabelText: props.label,
    fullWidth: props.fullWidth,
    disabled: props.disabled
  }} component={renderTextField} />

export default renderFormField

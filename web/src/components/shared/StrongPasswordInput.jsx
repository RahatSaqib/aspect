import React from 'react'
import { Field } from 'redux-form/immutable'
import TextField from 'material-ui/TextField'
import styles from './Shared.css'

/*
 weakPasswordMeter: {
 id: 'pages.LoginDetailsForm.weakPasswordMeter',
 defaultMessage: 'Weak'
 },
 okayPasswordMeter: {
 id: 'pages.LoginDetailsForm.okayPasswordMeter',
 defaultMessage: 'Okay'
 },
 strongPasswordMeter: {
 id: 'pages.LoginDetailsForm.strongPasswordMeter',
 defaultMessage: 'Strong'
 },
 passwordStrengthMeterMinLength: {
 id: 'pages.LoginDetailsForm.passwordStrengthMeterMinLength',
 defaultMessage: 'Is at least 6 characters long'
 },
 passwordStrengthMeterContainsNumber: {
 id: 'pages.LoginDetailsForm.passwordStrengthMeterContainsNumber',
 defaultMessage: 'Has a number'
 },
 passwordStrengthMeterMixUpperAndLowerCase: {
 id: 'pages.LoginDetailsForm.passwordStrengthMeterMixUpperAndLowerCase',
 defaultMessage: 'Has a mix of UPPER and lower case characters'
 },
 passwordStrengthMeterContainsSpecialCharacter: {
 id: 'pages.LoginDetailsForm.passwordStrengthMeterContainsSpecialCharacter',
 defaultMessage: 'Has a special character (%!$*...)'
 },*/

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
    maxLength: maxLength,
    type: 'password'
  }} component={renderTextField} />
}

export default renderFormField

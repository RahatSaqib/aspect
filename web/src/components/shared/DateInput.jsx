import React from 'react'
import { Field } from 'redux-form/immutable'
import DatePicker from 'material-ui/DatePicker'
import classNames from 'classnames'
import styles from './Shared.css'

const renderDateField = props => {
  const { input, meta, dateFieldProps } = props
  const { touched, error } = meta

  const onChange = (evt, date) => {
    if (input.onChange) {
      input.onChange(date)
    }
  }
  return (
    <DatePicker
      {...input}
      onChange={onChange}
      errorStyle={{
        float: 'left',
        whiteSpace: 'nowrap',
        textOverflow: 'visible',
      }}
      errorText={touched && error}
      {...dateFieldProps}
      className={classNames({ [styles.Form__Field]: dateFieldProps.fullWidth })}
    />
  )
}

const renderFormField = props => {
  const {
    name,
    label,
    fullWidth,
    autoFocus,
    autoOk,
    disabled,
    onChange,
    onKeyPress,
    mode,
    container,
    style,
  } = props
  const dateFieldProps = {
    floatingLabelText: label,
    fullWidth,
    autoFocus,
    disabled,
    mode,
    container,
    autoOk,
    style,
  }
  if (onChange) {
    dateFieldProps.onChange = onChange
  }
  if (onKeyPress) {
    dateFieldProps.onKeyPress = onKeyPress
  }
  return (
    <Field
      name={name}
      dateFieldProps={dateFieldProps}
      component={renderDateField}
    />
  )
}

export default renderFormField

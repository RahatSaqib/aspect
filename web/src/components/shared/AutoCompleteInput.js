import React from 'react'
import { Field } from 'redux-form/immutable'
import AutoComplete from 'material-ui/AutoComplete'

const renderAutoComplete = props =>
  <AutoComplete {...props.input} errorStyle={{ float: 'left' }}
             errorText={props.meta.touched && props.meta.error} {...props.autoCompleteFieldProps} />

const renderFormField = props => <Field name={props.name} autoCompleteFieldProps={{
  floatingLabelText: props.label,
  fullWidth: props.fullWidth,
  disabled: props.disabled,
  filter: props.filter,
  openOnFocus: props.openOnFocus,
  dataSource: props.dataSource,
  dataSourceConfig: props.dataSourceConfig
}} component={renderAutoComplete}/>

export default renderFormField

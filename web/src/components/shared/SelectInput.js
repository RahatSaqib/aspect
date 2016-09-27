import React from 'react'
import { Field } from 'redux-form/immutable'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import _ from 'lodash'

const renderSelectField = props => {
  const onChange = (event, index, value) => {
    if(props.onSelectionChanged){
      props.onSelectionChanged(event, index, value)
    }
    props.input.onChange(value)
  }
  return (
    <SelectField {...props.input} errorStyle={{float: 'left'}}
                 errorText={props.meta.touched && props.meta.error}
                 {...props.selectFieldProps} children={props.children}
                 onChange={onChange} />)
}

const renderFormField = props => {
  const {label, onChange, fullWidth, disabled, dataSource, dataSourceConfig} = props

  const selectItems = _.map(dataSource.toJS(), item => {
    return {
      key: item[dataSourceConfig.value],
      value: item[dataSourceConfig.value],
      primaryText: item[dataSourceConfig.text]
    }
  })

  return <Field name={props.name} onSelectionChanged={onChange} selectFieldProps={{
    floatingLabelText: label,
    fullWidth: fullWidth,
    disabled: disabled
  }} component={renderSelectField}>
    <MenuItem key={-1} value={null} />
    { selectItems.map(item => <MenuItem {...item} />) }
  </Field>
}

export default renderFormField

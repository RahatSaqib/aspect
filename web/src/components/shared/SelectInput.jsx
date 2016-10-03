import React from 'react'
import { Field } from 'redux-form/immutable'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import _ from 'lodash'

const renderSelectField = props => {
  const {onSelectionChanged, input, meta, selectFieldProps, children} = props,
    {touched, error} = meta
  const onChange = (event, index, value) => {
    if(onSelectionChanged){
      onSelectionChanged(event, index, value)
    }
    input.onChange(value)
  }
  return <SelectField {...input} errorStyle={{float: 'left'}} style={{verticalAlign: 'bottom'}}
                 errorText={touched && error} {...selectFieldProps} children={children}
                 onChange={onChange} />
}

const renderFormField = props => {
  const {name, label, onChange, fullWidth, disabled, dataSource, dataSourceConfig} = props,
    valueKey = dataSourceConfig.value, textKey = dataSourceConfig.text

  const selectItems = _.map(dataSource, item => {
    return {
      key: item[valueKey],
      value: item[valueKey],
      primaryText: item[textKey]
    }
  })

  return <Field name={name} onSelectionChanged={onChange}
                selectFieldProps={{ floatingLabelText: label, fullWidth: fullWidth, disabled: disabled }}
                component={renderSelectField}>
      { selectItems.map(item => <MenuItem {...item} />) }
    </Field>
}

export default renderFormField

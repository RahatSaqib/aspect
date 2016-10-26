import _ from 'lodash'
import React from 'react'
import { Field } from 'redux-form/immutable'
import MenuItem from 'material-ui/MenuItem'

import ForkedSelectField from '../forkedMaterialUi/ForkedSelectField'
import styles from './Shared.css'

const MenuItemLabel = props => {
  const {text, selectedItemStyle} = props
  return <div style={{...{display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}, ...selectedItemStyle}}>
    {text}
  </div>
}

const renderSelectField = props => {
  const {onSelectionChanged, input, meta, selectFieldProps, children} = props,
    {touched, error} = meta
  const onChange = (event, index, value) => {
    if(onSelectionChanged){
      onSelectionChanged(event, index, value)
    }
    input.onChange(value)
  }
  return (
    <ForkedSelectField
      {...input} errorStyle={{float: 'left'}} style={{verticalAlign: 'bottom'}}
      errorText={touched && error} {...selectFieldProps} children={children}
      onChange={onChange} className={styles.Form__Field}
      tabIndex="0" aria-haspopup />
  )
}

const renderFormField = props => {
  const {name, label, onChange, fullWidth, disabled, dataSource, dataSourceConfig, autoWidth, selectedItemStyle} = props,
    valueKey = dataSourceConfig.value, textKey = dataSourceConfig.text

  const selectItems = _.map(dataSource, item => {
    return {
      key: item[valueKey],
      value: item[valueKey],
      primaryText: item[textKey]
    }
  })

  return <Field name={name} onSelectionChanged={onChange}
                selectFieldProps={{ floatingLabelText: label, fullWidth: fullWidth, disabled: disabled, autoWidth: autoWidth }}
                component={renderSelectField}>
      { selectItems.map(item => <MenuItem key={item.key} value={item.value}
                                          primaryText={item.primaryText}
                                          label={<MenuItemLabel text={item.primaryText} selectedItemStyle={selectedItemStyle} />} />) }
    </Field>
}

export default renderFormField

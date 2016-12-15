import _ from 'lodash'
import React from 'react'
import { Field } from 'redux-form/immutable'
import MenuItem from 'material-ui/MenuItem'
import classNames from 'classnames'

import ForkedSelectField from '../forkedMaterialUi/ForkedSelectField'
import styles from './Shared.css'

const MenuItemLabel = (props) => {
  const { text, selectedItemStyle } = props
  return (<div style={{ ...{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }, ...selectedItemStyle }}>
    {text}
  </div>)
}

const renderSelectField = (props) => {
  const { onSelectionChanged, input, meta, selectFieldProps, children } = props
  const { touched, error } = meta
  const onChange = (event, index, value) => {
    if (onSelectionChanged) {
      onSelectionChanged(event, index, value)
    }
    input.onChange(value)
  }
  const selectFieldStyle = { verticalAlign: 'bottom', ...selectFieldProps.style }
  return (
    <ForkedSelectField
      {...input} errorStyle={{ float: 'left' }} {...selectFieldProps}
      errorText={touched && error} style={selectFieldStyle}
      onChange={onChange} tabIndex="0" aria-haspopup
      className={classNames({ [styles.Form__Field]: selectFieldProps.fullWidth })}
    >
      {children}
    </ForkedSelectField>
  )
}

const renderFormField = (props) => {
  const {
    name,
    label,
    onChange,
    fullWidth,
    disabled,
    dataSource,
    dataSourceConfig,
    autoWidth,
    selectedItemStyle,
    style
  } = props
  const valueKey = dataSourceConfig.value
  const textKey = dataSourceConfig.text
  const selectItems = _.map(dataSource, item => ({
    key: item[valueKey] || '-1',
    value: item[valueKey] || null,
    primaryText: item[textKey]
  }))

  return (<Field
    name={name} onSelectionChanged={onChange}
    selectFieldProps={{ floatingLabelText: label, fullWidth, disabled, autoWidth, style }}
    component={renderSelectField}
  >
    { selectItems.map(item => <MenuItem
      key={item.key} value={item.value}
      primaryText={item.primaryText}
      label={<MenuItemLabel text={item.primaryText} selectedItemStyle={selectedItemStyle} />}
    />) }
  </Field>)
}

export default renderFormField

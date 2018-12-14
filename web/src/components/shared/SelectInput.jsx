import _ from 'lodash'
import React from 'react'
import { Field } from 'redux-form/immutable'
import MenuItem from '@material-ui/core/MenuItem'
import classNames from 'classnames'

import SelectField from './SelectField'
import styles from './Shared.css'

const MenuItemLabel = props => {
  const { text, selectedItemStyle } = props
  return (
    <div
      style={{
        ...{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        },
        ...selectedItemStyle,
      }}
    >
      {text}
    </div>
  )
}

const renderSelectField = props => {
  const { onSelectionChanged, input, meta, selectFieldProps, children } = props
  const { touched, error } = meta
  const onChange = event => {
    if (onSelectionChanged) {
      onSelectionChanged(event)
    }
    input.onChange(event.target.value)
  }
  const selectFieldStyle = {
    verticalAlign: 'bottom',
    ...selectFieldProps.style,
  }
  return (
    <SelectField
      {...input}
      errorStyle={{
        float: 'left',
        whiteSpace: 'nowrap',
        textOverflow: 'visible',
      }}
      {...selectFieldProps}
      errorText={touched && error}
      style={selectFieldStyle}
      onChange={onChange}
      tabIndex="0"
      aria-haspopup
      className={classNames({
        [styles.Form__Field]: selectFieldProps.fullWidth,
      })}
    >
      {children}
    </SelectField>
  )
}

const renderFormField = props => {
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
    style,
  } = props
  const valueKey = dataSourceConfig.value
  const textKey = dataSourceConfig.text
  const selectItems = _.map(dataSource, item => ({
    key: item[valueKey] || '-1',
    value: item[valueKey] || null,
    primaryText: item[textKey],
  }))

  return (
    <Field
      name={name}
      onSelectionChanged={onChange}
      selectFieldProps={{
        floatingLabelText: label,
        fullWidth,
        disabled,
        autoWidth,
        style,
      }}
      component={renderSelectField}
    >
      {selectItems.map(item => (
        <MenuItem
          key={item.key}
          value={item.value}
          label={
            <MenuItemLabel
              text={item.primaryText}
              selectedItemStyle={selectedItemStyle}
            />
          }
        >
          {item.primaryText}
        </MenuItem>
      ))}
    </Field>
  )
}

export default renderFormField

import React from 'react'
import { timezones } from '../filter/hardcoded'
import SelectInput from './SelectInput'

/**
 * @deprecated Use TimeZoneSelect from MigratedComponents
 */
const renderFormField = props => {
  const { name, label, disabled, fullWidth, defaultTimezoneText } = props
  const timezoneData = defaultTimezoneText ? [{ id: null, name: defaultTimezoneText }].concat(timezones) : timezones
  return (
    <SelectInput
      name={name}
      label={label}
      disabled={disabled}
      autoWidth
      fullWidth={fullWidth}
      dataSource={timezoneData}
      dataSourceConfig={{ text: 'name', value: 'id' }}
    />
  )
}

export default renderFormField

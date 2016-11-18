import React from 'react'
import SelectInput from './SelectInput'
import { timezones } from '../../shared/utils/timezone'

const renderFormField = (props) => {
  const { name, label, disabled, fullWidth, defaultTimezoneText } = props
  const timezoneData = defaultTimezoneText ?
    [{ id: null, name: defaultTimezoneText }].concat(timezones) : timezones
  return (<SelectInput
    name={name} label={label} disabled={disabled} autoWidth fullWidth={fullWidth}
    dataSource={timezoneData} dataSourceConfig={{ text: 'name', value: 'id' }}
  />)
}

export default renderFormField

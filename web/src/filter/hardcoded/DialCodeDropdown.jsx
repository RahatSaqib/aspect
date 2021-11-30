import React from 'react'

import Select from 'react-select'

import { getMuiTheme } from '../../MigratedComponents/AspectDropDown'

export const DialCodeDropdown = ({ onChange, name, options, defaultValue }) => {
  return (
    <div style={{ width: '350px', padding: '20px 0', marginRight: '30px' }}>
      <Select
        name={`${name}-country-code`}
        id={`${name}-country-code`}
        isDisabled={false}
        isLoading={false}
        isMulti={false}
        options={options}
        defaultValue={defaultValue}
        styles={getMuiTheme()}
        onChange={selected => onChange({ dialCode: selected?.value })}
        // noOptionsMessage={() => formatMessage(messagesBase.noOptionsMessage)}
      />
    </div>
  )
}

export default DialCodeDropdown

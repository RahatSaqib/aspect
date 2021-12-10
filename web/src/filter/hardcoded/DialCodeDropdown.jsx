import React, { useEffect, useState } from 'react'
import filter from 'lodash/filter'

import Select from 'react-select'

import { getMuiTheme } from '../../MigratedComponents/AspectDropDown'

export const DialCodeDropdown = ({ onChange, name, options, value }) => {
  const [selected, setSelected] = useState(false)
  // console.log({ options: filter(options, { value })[0], value, defaultValue })

  useEffect(() => {
    if (selected !== filter(options, { value })[0]) {
      setSelected(filter(options, { value })[0])
    }
  }, [value, options, selected])

  console.log(selected)

  return (
    <div style={{ width: '350px', padding: '20px 0', marginRight: '30px' }}>
      <Select
        name={`${name}-country-code`}
        id={`${name}-country-code`}
        isDisabled={false}
        isLoading={false}
        isMulti={false}
        options={options}
        defaultValue={selected}
        styles={getMuiTheme()}
        onChange={onChange}
        // noOptionsMessage={() => formatMessage(messagesBase.noOptionsMessage)}
      />
    </div>
  )
}

export default DialCodeDropdown

import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { timezones } from '../../oldComponents/filter/hardcoded'

const TimezoneSelect = ({ name, label, disabled, width, defaultTimezoneText, value, onChange }) => {
  const timezoneData = defaultTimezoneText ? [{ id: null, name: defaultTimezoneText }].concat(timezones) : timezones

  return (
    <span style={{ width }}>
      <TextField
        select
        name={name}
        label={label}
        variant="standard"
        disabled={disabled}
        style={{ width: '98%', marginRight: '1%', marginLeft: '1%', marginTop: '16px' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {timezoneData.map(zone => (
          <MenuItem key={zone.id} value={zone.id}>
            {zone.name}
          </MenuItem>
        ))}
      </TextField>
    </span>
  )
}

export default TimezoneSelect

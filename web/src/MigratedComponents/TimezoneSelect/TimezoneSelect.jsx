import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import InputLabel from '@material-ui/core/InputLabel'
import { timezones } from '../../filter/hardcoded'

const TimezoneSelect = ({ name, label, disabled, fullWidth, defaultTimezoneText, value, onChange }) => {
  const timezoneData = defaultTimezoneText ? [{ id: null, name: defaultTimezoneText }].concat(timezones) : timezones

  return (
    <>
      <InputLabel id={label}>{label}</InputLabel>
      <Select
        name={name}
        label={label}
        variant="standard"
        disabled={disabled}
        fullWidth={fullWidth}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {timezoneData.map(zone => (
          <MenuItem key={zone.id} value={zone.id}>
            {zone.name}
          </MenuItem>
        ))}
      </Select>
    </>
  )
}

export default TimezoneSelect

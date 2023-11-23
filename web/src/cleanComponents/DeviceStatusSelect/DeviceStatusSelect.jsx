import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, IconButton, MenuItem } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'

const options = {
  up: ['active', 'reportedActive', 'inactiveNoTestsPerformed'],
  down: [
    'inactiveOutOfInventory',
    'inactiveDownForRepair',
    'inactiveNoStaff',
    'inactiveNoPower',
    'inactiveNoSamples',
    'inactiveOther',
  ],
  unknown: ['inactiveUnknown'],
}

const getCurrentValue = value => {
  value = Array.isArray(value) ? value : [value]

  return Object.keys(options).reduce((prev, key) => {
    if (options[key].sort().join(',') === value.sort().join(',')) return key
    return prev
  }, '')
}

const DeviceStatusSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { formatMessage } = useIntl()

  const handleChange = e => {
    onChange(options[e.target.value])
  }

  return (
    <TextField
      id={id}
      name={name}
      label={label}
      error={error}
      helperText={helperText}
      select
      variant="standard"
      value={getCurrentValue(value)}
      onChange={handleChange}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton sx={{ visibility: value ? 'visible' : 'hidden' }} onClick={() => onChange([])}>
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      <MenuItem value="up">{formatMessage(messages.optionUp)}</MenuItem>
      <MenuItem value="down">{formatMessage(messages.optionDown)}</MenuItem>
      <MenuItem value="unknown">{formatMessage(messages.optionUnknown)}</MenuItem>
    </TextField>
  )
}

export default DeviceStatusSelect

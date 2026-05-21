import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'

const DeviceTypeSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { isLoading, data: deviceTypes } = useDeviceTypeList()
  return isLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      id={id}
      name={name}
      label={label}
      error={error}
      helperText={helperText}
      select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange('')}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {deviceTypes.map(c => (
        <MenuItem key={c.externalId} value={c.externalId}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DeviceTypeSelect

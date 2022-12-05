import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useDeviceTypeList from '../../hooks/deviceType/useDevicetypeList'

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
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {deviceTypes.map(c => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DeviceTypeSelect

import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useDeviceCapacityForSelect from '../../hooks/device/useDeviceCapacityForSelect'

const DeviceCapacitySelect = ({ name, label, value, onChange, deviceTypeId }) => {
  const { isLoading, data } = useDeviceCapacityForSelect(deviceTypeId)

  const selected = data ? data.filter(i => i.dailyCapacity === value)[0].id : ''

  return (
    <span style={{ width: '100%' }}>
      {isLoading ? (
        <LinearProgress />
      ) : (
        <TextField
          select
          name={name}
          label={label}
          fullWidth
          variant="standard"
          value={selected}
          onChange={e => {
            onChange(e.target.value)
          }}
        >
          {(data || []).map(device => (
            <MenuItem key={device.id} value={device.id}>
              {device.dailyCapacity}
            </MenuItem>
          ))}
        </TextField>
      )}
    </span>
  )
}

export default DeviceCapacitySelect

import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useDeviceCapacityForSelect from '../../hooks/device/useDeviceCapacityForSelect'

const messages = {
  modules: {
    id: 'pages.DeviceCapacitySelect.modules',
    defaultMessage: `{numberOfModules, plural,
      one {# module}
      other {# modules}
    }`,
  },
}

const DeviceCapacitySelect = ({ name, label, value, onChange, deviceTypeId }) => {
  const { formatMessage } = useIntl()
  const { isLoading, data } = useDeviceCapacityForSelect(deviceTypeId)

  return (
    <span style={{ width: '100%' }}>
      {isLoading ? (
        <LinearProgress />
      ) : (
        <TextField
          select
          disabled={data.length === 0}
          name={name}
          label={label}
          fullWidth
          variant="standard"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {data.map(device => (
            <MenuItem key={device.id} value={device.id}>
              {device.dailyCapacity +
                (device.modules
                  ? ` (${formatMessage(messages.modules, {
                      numberOfModules: device.modules,
                    })})`
                  : '')}
            </MenuItem>
          ))}
        </TextField>
      )}
    </span>
  )
}

export default DeviceCapacitySelect

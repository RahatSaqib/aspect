import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import { useIntl } from 'react-intl'
import useDeviceMaintenanceStatus from '../../hooks/device/useDeviceMaintenanceStatus'
import { deviceStatusMessages } from '../../messages'

const DeviceMaintenanceStatusSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  onlyManuallySetableStatuses,
  multiple,
}) => {
  const { formatMessage } = useIntl()
  const { data: maintenanceStatuses, isLoading } = useDeviceMaintenanceStatus(onlyManuallySetableStatuses || false)

  const valueArray = value ? (Array.isArray(value) ? value : [value]) : []

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
      value={valueArray}
      onChange={onChange}
      disabled={disabled}
      SelectProps={{ IconComponent: () => null, multiple }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value.length ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: [] } })}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {maintenanceStatuses.map(c => (
        <MenuItem key={c.externalId} value={c.externalId}>
          {formatMessage(deviceStatusMessages[c.i18nKey])}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DeviceMaintenanceStatusSelect

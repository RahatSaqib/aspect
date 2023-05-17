import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useDeviceMaintenanceStatus from '../../hooks/device/useDeviceMaintenanceStatus'
import useI18n from '../../hooks/useI18n'
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
  const { formatMessage } = useI18n()
  const { data: maintenanceStatuses, isLoading } = useDeviceMaintenanceStatus(onlyManuallySetableStatuses || false)

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
      value={value || []}
      onChange={onChange}
      disabled={disabled}
      SelectProps={{ IconComponent: () => null, multiple }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value.length ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
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

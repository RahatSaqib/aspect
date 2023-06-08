import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, TextField, IconButton, MenuItem } from '@mui/material'
import useDeviceApprovalType from '../../hooks/device/useDeviceApprovalType'
import useI18n from '../../hooks/useI18n'
import { deviceApprovalMessages } from '../../messages'

const DeviceApprovalSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { formatMessage } = useI18n()
  const { isLoading, data } = useDeviceApprovalType()

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
      variant="standard"
      value={value}
      onChange={onChange}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: undefined } })}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {data.map(o => (
        <MenuItem key={o.id} value={o.id}>
          {formatMessage(deviceApprovalMessages[o.i18nKey])}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DeviceApprovalSelect

import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useConsumable from '../../hooks/inventory/useConsumable'
import useI18n from '../../hooks/useI18n'
import { consumableMessages } from '../../messages'

const ConsumableSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { formatMessage } = useI18n()
  const { loading: isConsumableLoading, data: consumables } = useConsumable()

  return isConsumableLoading ? (
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
      disabled={(consumables || []).length === 0}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
            disabled={(consumables || []).length === 0}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {(consumables || []).map(c => (
        <MenuItem key={c.id} value={c.id}>
          {formatMessage(consumableMessages[c.i18nKey])}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default ConsumableSelect

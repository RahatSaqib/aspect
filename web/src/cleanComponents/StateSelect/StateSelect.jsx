import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'

const StateSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  countryId,
  returnAll,
  onlyAssociatedSites,
  disabled,
}) => {
  const { isLoading: isStateLoading, data: states } = useStatesByCountry(
    { countryId, returnAll, onlyAssociatedSites },
    { enabled: !!countryId }
  )

  return isStateLoading ? (
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
      onChange={onChange}
      disabled={(states || []).length === 0 || disabled}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
            disabled={(states || []).length === 0 || disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {(states || []).map(s => (
        <MenuItem key={s.id} value={s.id}>
          {s.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default StateSelect

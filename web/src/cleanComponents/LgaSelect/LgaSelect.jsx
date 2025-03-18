import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useLgaByState from '../../hooks/geography/useLgaByState'

const LgaSelect = ({ id, name, label, value, onChange, error, helperText, stateId, returnAll, disabled }) => {
  const { isLoading: isLgaLoading, data: lgas } = useLgaByState({ stateId, returnAll }, { enabled: !!stateId })

  return isLgaLoading ? (
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
      disabled={(lgas || []).length === 0 || disabled}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
            disabled={(lgas || []).length === 0 || disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {(lgas || []).map(c => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default LgaSelect

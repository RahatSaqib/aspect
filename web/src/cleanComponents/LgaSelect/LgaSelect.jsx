import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useLgaByState from '../../hooks/geography/useLgaByState'

const LgaSelect = ({ id, name, label, value, onChange, error, helperText, stateId }) => {
  const { isLoading: isLgaLoading, data: lgas } = useLgaByState(stateId, { enabled: !!stateId })

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
      disabled={(lgas || []).length === 0}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: '' } })}
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

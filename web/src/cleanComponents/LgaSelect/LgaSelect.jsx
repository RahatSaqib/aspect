import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
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

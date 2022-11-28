import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'

const StateSelect = ({ id, name, label, value, onChange, error, helperText, countryId }) => {
  const { isLoading: isStateLoading, data: states } = useStatesByCountry(countryId, { enabled: !!countryId })

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
      value={value}
      onChange={onChange}
      disabled={(states || []).length === 0}
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

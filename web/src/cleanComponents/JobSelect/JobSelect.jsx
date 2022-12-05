import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useJobFunctions from '../../hooks/jobFunction/useJobFunctions'

const JobSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { isLoading, data } = useJobFunctions()

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
    >
      {data.map(c => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default JobSelect

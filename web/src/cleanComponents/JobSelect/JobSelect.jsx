import React, { useEffect } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useJobFunctions from '../../hooks/jobFunction/useJobFunctions'

const JobSelect = ({ id, name, label, value, onChange, error, helperText, disabled, setDisableConstraints }) => {
  const { isLoading, data = [] } = useJobFunctions()
  const superAdminJobFunction = data.find(c => c.name === 'Super Admin')

  // The Super Admin job function cannot be restricted
  useEffect(() => {
    setDisableConstraints(data.length === 0 || (superAdminJobFunction && value === superAdminJobFunction.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
      disabled={disabled}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
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

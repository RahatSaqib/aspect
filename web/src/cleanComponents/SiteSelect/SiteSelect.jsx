import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useSiteList from '../../hooks/site/useSiteList'

const SiteSelect = ({ id, name, label, value, onChange, error, helperText, disabled, stateId, lgaId }) => {
  const { isLoading, data: sites } = useSiteList()

  const data =
    sites && lgaId
      ? sites.filter(s => s.lgaId === lgaId)
      : sites && stateId
      ? sites.filter(s => s.stateId === stateId)
      : sites

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
      value={value}
      onChange={onChange}
      disabled={disabled}
      SelectProps={{ IconComponent: () => null }}
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

export default SiteSelect

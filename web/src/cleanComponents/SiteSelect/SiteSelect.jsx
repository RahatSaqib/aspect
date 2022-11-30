import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useSiteList from '../../hooks/site/useSiteList'

const SiteSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { isLoading, data: sites } = useSiteList()

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
    >
      {sites.map(c => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default SiteSelect

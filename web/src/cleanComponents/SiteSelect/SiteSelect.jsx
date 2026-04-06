import React, { useMemo } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import filter from 'lodash/filter'
import useSiteList from '../../hooks/site/useSiteList'

const SiteSelect = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled,
  stateId,
  lgaId,
  customFilter,
  required,
}) => {
  const { isLoading, data: sites } = useSiteList()

  const data = useMemo(() => {
    if (!sites) return []
    const items = lgaId ? filter(sites, { lgaId }) : stateId ? filter(sites, { stateId }) : sites
    return customFilter ? customFilter(items) : items
  }, [customFilter, lgaId, sites, stateId])

  return isLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      id={id}
      name={name}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      select
      value={value}
      onChange={onChange}
      onBlur={onBlur}
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

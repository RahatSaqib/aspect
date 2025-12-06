import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { IconButton, LinearProgress, MenuItem, TextField } from '@mui/material'
import useTagByType from '../../hooks/tag/useTagByType'

const TagSingleSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { isLoading, data } = useTagByType('site')

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
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
            disabled={disabled || (data || []).length === 0}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {(data || []).map(tag => (
        <MenuItem key={tag.id} value={tag.id}>
          {tag.title}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default TagSingleSelect

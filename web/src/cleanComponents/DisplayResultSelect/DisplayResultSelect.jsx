import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, IconButton, MenuItem } from '@mui/material'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'

const messages = defineMessages({
  optionActual: {
    id: 'pages.displayResultSelectField.Actual',
    defaultMessage: 'Actual',
  },
  optionExcluded: {
    id: 'pages.displayResultSelectField.Excluded',
    defaultMessage: 'Excluded',
  },
})

const DisplayResultSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { formatMessage } = useI18n()

  return (
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
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: undefined } })}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      <MenuItem value="actual">{formatMessage(messages.optionActual)}</MenuItem>
      <MenuItem value="excluded">{formatMessage(messages.optionExcluded)}</MenuItem>
    </TextField>
  )
}

export default DisplayResultSelect

import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { MenuItem, TextField, IconButton } from '@mui/material'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'

const messages = defineMessages({
  optionFalse: {
    id: 'pages.revokedSelectField.false',
    defaultMessage: 'False',
  },
  optionTrue: {
    id: 'pages.revokedSelectField.true',
    defaultMessage: 'True',
  },
})

const RevokeSelect = ({ id, name, label, value, onChange, error, helperText }) => {
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
            onClick={() => onChange({ target: { name, value: null } })}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      <MenuItem value="0">{formatMessage(messages.optionFalse)}</MenuItem>
      <MenuItem value="1">{formatMessage(messages.optionTrue)}</MenuItem>
    </TextField>
  )
}

export default RevokeSelect

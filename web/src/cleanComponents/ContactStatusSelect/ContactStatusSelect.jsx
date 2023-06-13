import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, IconButton, MenuItem } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import messages from './messages'

const ContactStatusSelect = ({ id, name, label, value, onChange, error, helperText }) => {
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
      <MenuItem value="0">{formatMessage(messages.contactEnabled)}</MenuItem>
      <MenuItem value="1">{formatMessage(messages.contactDisabled)}</MenuItem>
    </TextField>
  )
}

export default ContactStatusSelect

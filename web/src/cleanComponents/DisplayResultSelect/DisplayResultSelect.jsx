import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, IconButton, MenuItem } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'

const DisplayResultSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { formatMessage } = useIntl()

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
      <MenuItem value="all">{formatMessage(messages.optionAll)}</MenuItem>
      <MenuItem value="actual">{formatMessage(messages.optionActual)}</MenuItem>
      <MenuItem value="excluded">{formatMessage(messages.optionExcluded)}</MenuItem>
    </TextField>
  )
}

export default DisplayResultSelect

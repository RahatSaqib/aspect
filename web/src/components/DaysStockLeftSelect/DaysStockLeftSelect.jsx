import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, IconButton, MenuItem } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'

const DaysStockLeftSelect = ({ id, name, label, value, onChange, error, helperText }) => {
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
      {options.map(o => (
        <MenuItem key={o.externalId} value={o.externalId}>
          {formatMessage(messages[o.externalId])}
        </MenuItem>
      ))}
    </TextField>
  )
}

const options = [
  { externalId: 'outOfStock', name: 'Out of Stock' },
  { externalId: 'upTo14', name: '1-14 Days ' },
  { externalId: 'upTo30', name: '15-30 Days' },
  { externalId: 'upTo90', name: '1-3 Months' },
  { externalId: 'upTo180', name: '4-6 Months' },
  { externalId: 'moreThan180', name: '>6 Months' },
  { externalId: 'notRecorded', name: 'Not Recorded' },
  { externalId: 'noConsumption', name: 'No Consumption' },
]

export default DaysStockLeftSelect

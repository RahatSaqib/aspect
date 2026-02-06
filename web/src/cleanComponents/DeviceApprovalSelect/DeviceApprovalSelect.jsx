import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, TextField, IconButton, MenuItem, ListItemText, Checkbox } from '@mui/material'
import { useIntl, defineMessages } from 'react-intl'
import useDeviceApprovalType from '../../hooks/device/useDeviceApprovalType'
import { deviceApprovalMessages } from '../../messages'

const localMessages = defineMessages({
  all: {
    id: 'pages.shared.deviceApproval.all',
    defaultMessage: 'All',
  },
})

const ALL_VALUE = '__all__'

const DeviceApprovalSelect = ({ id, name, label, value, onChange, error, helperText, multiple }) => {
  const { formatMessage } = useIntl()
  const { isLoading, data } = useDeviceApprovalType()
  const options = data ?? []

  if (!multiple) {
    // Original single-select behavior
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
          <MenuItem key={o.id} value={o.id}>
            {formatMessage(deviceApprovalMessages[o.i18nKey])}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  // Multi-select behavior
  const valueArray = value ? (Array.isArray(value) ? value : [value]) : []
  const allSelected = options.length > 0 && valueArray.length === options.length

  const handleChange = event => {
    const selected = event.target.value
    // When "All" is toggled
    if (selected.includes(ALL_VALUE)) {
      if (allSelected) {
        // Deselect all
        onChange({ target: { name, value: [] } })
      } else {
        // Select all
        onChange({ target: { name, value: options.map(o => o.id) } })
      }
      return
    }
    onChange({ target: { name, value: selected } })
  }

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
      value={valueArray}
      onChange={handleChange}
      SelectProps={{
        IconComponent: () => null,
        multiple: true,
        renderValue: selected => {
          if (!selected || selected.length === 0) return ''
          if (options.length > 0 && selected.length === options.length) return formatMessage(localMessages.all)
          return selected
            .map(id => {
              const item = options.find(o => o.id === id)
              return item ? formatMessage(deviceApprovalMessages[item.i18nKey]) : ''
            })
            .filter(Boolean)
            .join(', ')
        },
      }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: valueArray.length ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: [] } })}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      <MenuItem value={ALL_VALUE}>
        <Checkbox checked={allSelected} indeterminate={valueArray.length > 0 && !allSelected} />
        <ListItemText primary={formatMessage(localMessages.all)} />
      </MenuItem>
      {options.map(o => (
        <MenuItem key={o.id} value={o.id}>
          <Checkbox checked={valueArray.includes(o.id)} />
          <ListItemText primary={formatMessage(deviceApprovalMessages[o.i18nKey])} />
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DeviceApprovalSelect

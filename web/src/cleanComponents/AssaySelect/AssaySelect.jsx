import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { IconButton, LinearProgress, MenuItem, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useAssayList from '../../hooks/assay/useAssayList'
import { assay } from '../../messages'

const AssaySelect = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  assayTypeId,
  deviceTypeId,
  onlyResults = false,
  single = false,
}) => {
  const { isLoading, data: assayList } = useAssayList()
  const { formatMessage } = useIntl()

  let data = assayList
    ? assayTypeId && deviceTypeId
      ? assayList.filter(s => s.assayTypeId === assayTypeId && s.deviceTypeExternalId === deviceTypeId)
      : assayTypeId
      ? assayList.filter(s => s.assayTypeId === assayTypeId)
      : deviceTypeId
      ? assayList.filter(s => s.deviceTypeId === deviceTypeId)
      : assayList
    : []

  data = assayList && onlyResults ? data.filter(a => a.hasResults) : data

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
            sx={{ visibility: value && !single ? 'visible' : 'hidden' }}
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
          {formatMessage(assay[c.i18nKey])}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default AssaySelect

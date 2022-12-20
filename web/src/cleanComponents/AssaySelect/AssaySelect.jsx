import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useAssayList from '../../hooks/assay/useAssayList'
import useI18n from '../../hooks/useI18n'
import { assay } from '../../messages'

const AssaySelect = ({ id, name, label, value, onChange, error, helperText, disabled, assayTypeId, deviceTypeId }) => {
  const { isLoading, data: assayList } = useAssayList()
  const { formatMessage } = useI18n()

  const data =
    assayList && assayTypeId && deviceTypeId
      ? assayList.filter(s => s.assayTypeId === assayTypeId && s.deviceTypeId === deviceTypeId)
      : assayList && assayTypeId
      ? assayList.filter(s => s.assayTypeId === assayTypeId)
      : assayList && deviceTypeId
      ? assayList.filter(s => s.deviceTypeId === deviceTypeId)
      : assayList

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
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: '' } })}
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

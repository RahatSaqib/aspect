import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useAssayTypeList from '../../hooks/assay/useAssayTypeList'
import useI18n from '../../hooks/useI18n'
import { assay } from '../../messages'

const AssayTypeSelect = ({ id, name, label, value, onChange, error, helperText, disabled, diseaseId }) => {
  const { isLoading, data: assayTypes } = useAssayTypeList()
  const { formatMessage } = useI18n()

  const data = assayTypes && diseaseId ? assayTypes.filter(s => s.diseaseId === diseaseId) : assayTypes

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

export default AssayTypeSelect

import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import { useIntl } from 'react-intl'
import useDiseaseList from '../../hooks/disease/useDiseaseList'
import { diseases } from '../../messages'

const DiseaseSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { isLoading, data: diseasesList } = useDiseaseList()
  const { formatMessage } = useIntl()

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
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange('')}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {diseasesList.map(c => (
        <MenuItem key={c.id} value={c.id}>
          {formatMessage(diseases[c.i18nKey])}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DiseaseSelect

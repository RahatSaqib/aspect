import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useDiseaseList from '../../hooks/disease/useDiseaseList'
import useI18n from '../../hooks/useI18n'
import { diseases } from '../../messages'

const DiseaseSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { isLoading, data: sites } = useDiseaseList()
  const { formatMessage } = useI18n()

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
    >
      {sites.map(c => (
        <MenuItem key={c.id} value={c.id}>
          {formatMessage(diseases[c.i18nKey])}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default DiseaseSelect

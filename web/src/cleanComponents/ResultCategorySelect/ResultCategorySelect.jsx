import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useAssayList from '../../hooks/assay/useAssayList'
import useI18n from '../../hooks/useI18n'
import messages from './messages'

const ResultCategorySelect = ({ id, name, label, value, onChange, error, helperText, disabled, assayId }) => {
  const { formatMessage } = useI18n()
  const { isLoading, data: assays } = useAssayList()

  const possibleAssay = (assays || []).find(a => a.id === assayId)
  const resultCategories = possibleAssay ? possibleAssay.resultCategories : []

  return isLoading ? (
    <LinearProgress />
  ) : (
    <>
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
        {resultCategories.map(c => (
          <MenuItem key={c.id} value={c.id}>
            {formatMessage(messages[c.i18nKey])}
          </MenuItem>
        ))}
      </TextField>
    </>
  )
}

export default ResultCategorySelect

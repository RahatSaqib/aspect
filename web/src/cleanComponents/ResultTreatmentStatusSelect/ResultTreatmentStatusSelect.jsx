import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useTreatmentStatus from '../../hooks/result/useTreatmentStatus'
import useI18n from '../../hooks/useI18n'
import { resultTreatmentStatusMessages } from '../../messages'

const ResultTreatmentStatusSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { formatMessage } = useI18n()
  const { data: treatmentStatuses, isLoading } = useTreatmentStatus()

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
        value={value || []}
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
        {treatmentStatuses.map(c => (
          <MenuItem key={c.externalId} value={c.externalId}>
            {formatMessage(resultTreatmentStatusMessages[c.i18nKey])}
          </MenuItem>
        ))}
      </TextField>
    </>
  )
}

export default ResultTreatmentStatusSelect

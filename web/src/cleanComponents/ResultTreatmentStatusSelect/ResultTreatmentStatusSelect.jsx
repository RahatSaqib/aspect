import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import { useIntl } from 'react-intl'
import useTreatmentStatus from '../../hooks/result/useTreatmentStatus'
import { resultTreatmentStatusMessages } from '../../messages'

const ResultTreatmentStatusSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { formatMessage } = useIntl()
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
              onClick={() => onChange({ target: { name, value: null } })}
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

import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useWorkflowStatus from '../../hooks/result/useWorkflowStatus'
import useI18n from '../../hooks/useI18n'
import messages from './messages'

const ResultWorkflowStatusSelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { formatMessage } = useI18n()
  const { data: maintenanceStatuses, isLoading } = useWorkflowStatus()

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
        {maintenanceStatuses.map(c => (
          <MenuItem key={c.id} value={c.id}>
            {formatMessage(messages[c.i18nKey])}
          </MenuItem>
        ))}
      </TextField>
    </>
  )
}

export default ResultWorkflowStatusSelect

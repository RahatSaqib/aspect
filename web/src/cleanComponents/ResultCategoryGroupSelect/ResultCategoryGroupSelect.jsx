import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useResultCategoryGroup from '../../hooks/result/useResultCategoryGroup'
import useI18n from '../../hooks/useI18n'
import messages from './messages'

const ResultCategoryGroupSelect = ({ id, name, label, value, onChange, error, helperText, disabled, assayId }) => {
  const { formatMessage } = useI18n()
  const { isLoading, data: resultCategoryGroups } = useResultCategoryGroup(assayId, { enabled: !!assayId })

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
              onClick={() => onChange({ target: { name, value: null } })}
              disabled={disabled}
            >
              <ClearIcon />
            </IconButton>
          ),
        }}
      >
        {resultCategoryGroups?.map(c => (
          <MenuItem key={c.externalId} value={c.externalId}>
            {formatMessage(messages[c.i18nKey])}
          </MenuItem>
        ))}
      </TextField>
    </>
  )
}

export default ResultCategoryGroupSelect

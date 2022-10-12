import React from 'react'
import { MenuItem } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import SelectField from '../../shared/SelectField'
import daysStockLeftOptions from './daysStockLeftOptions'
import messages from './messages'

export default ({ allItemText, onChange, value, ...restProps }) => {
  const handleSelectFieldChange = ({ target: { value } }) => {
    onChange(value === 'all' ? undefined : value)
  }
  const { formatMessage } = useI18n()
  return (
    <SelectField {...restProps} value={value} onChange={handleSelectFieldChange}>
      {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
      {daysStockLeftOptions.map(({ externalId, name }) => (
        <MenuItem key={externalId} value={externalId}>
          {messages[externalId] ? formatMessage(messages[externalId]) : name}
        </MenuItem>
      ))}
    </SelectField>
  )
}

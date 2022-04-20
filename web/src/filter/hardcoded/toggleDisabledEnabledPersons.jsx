import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import useI18n from '../../Hooks/i18n/useI18n'
import SelectField from '../../components/shared/SelectField'
import messages from './messages'

export default ({ allItemText, onChange, value, ...restProps }) => {
  const { formatMessage } = useI18n()
  const handleSelectFieldChange = ({ target: { value } }) => {
    onChange(value === 'all' ? undefined : value)
  }

  return (
    <SelectField
      {...restProps}
      value={value}
      onChange={handleSelectFieldChange}
    >
      {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
      <MenuItem value="0">{formatMessage(messages.contactEnabled)}</MenuItem>
      <MenuItem value="1">{formatMessage(messages.contactDisabled)}</MenuItem>
    </SelectField>
  )
}

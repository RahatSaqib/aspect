import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'

import { useIntl } from 'react-intl'
import SelectField from '../../components/shared/SelectField'
import messages from './messages'

export default ({ allItemText, onChange, value, ...restProps }) => {
  const handleSelectFieldChange = ({ target: { value } }) => {
    onChange(value === 'all' ? undefined : value)
  }
  const { formatMessage } = useIntl()
  return (
    <SelectField
      {...restProps}
      value={value}
      onChange={handleSelectFieldChange}
    >
      {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
      {[
        {
          id: 'enabled',
          name: 'Enabled',
        },
        {
          id: 'disabled',
          name: 'Disabled',
        },
      ].map(({ id, name }) => (
        <MenuItem key={id} value={id}>
          {messages[id] ? formatMessage(messages[id]) : name}
        </MenuItem>
      ))}
    </SelectField>
  )
}

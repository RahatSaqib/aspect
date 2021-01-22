import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import stockLeftOptions from './stockLeftOptions'

export default ({ allItemText, onChange, value, ...restProps }) => {
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
      {stockLeftOptions.map(({ externalId, name }) => (
        <MenuItem key={externalId} value={externalId}>
          {name}
        </MenuItem>
      ))}
    </SelectField>
  )
}

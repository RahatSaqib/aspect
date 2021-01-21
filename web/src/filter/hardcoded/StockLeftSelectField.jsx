import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import stockLeftItems from './stockLeft'

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
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {stockLeftItems.map(x => (
        <MenuItem key={x.externalId} value={x.externalId}>
          {x.name}
        </MenuItem>
      ))}
    </SelectField>
  )
}

import React, { useState } from 'react'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { dateRangeOptions } from '../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../hooks/useI18n'
import { commonDefinitions as messages } from '../../../messages'

const PeriodSelector = ({ onChange, initialValue }) => {
  const options = dateRangeOptions('deviceDateRange').deviceDateRange.sort((a, b) => `${a.id}`.localeCompare(b.id))
  const { formatMessage } = useI18n()
  const [innerValue, setInnerValue] = useState(initialValue)

  return (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-period">{formatMessage(messages.period)}</InputLabel>
      <Select
        labelId="select-period"
        value={innerValue}
        onChange={e => {
          setInnerValue(e.target.value)
          onChange(options.filter(o => o.id === e.target.value)[0].value)
        }}
      >
        {options.map(o => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default PeriodSelector

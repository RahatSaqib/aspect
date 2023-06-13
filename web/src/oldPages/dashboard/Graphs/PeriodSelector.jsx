import React, { useState } from 'react'
import { FormControl, InputLabel, MenuItem, Select, TextField, Stack } from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import { dateRangeOptions } from '../../../components/Graphs/Helpers/Formatters'
import useI18n from '../../../hooks/useI18n'
import { commonDefinitions as messages } from '../../../messages'

const PeriodSelector = ({ onChange, initialValue, allowCustom = true }) => {
  const options = dateRangeOptions('deviceDateRange').deviceDateRange.sort((a, b) => `${a.id}`.localeCompare(b.id))
  const { formatMessage } = useI18n()
  const [innerValue, setInnerValue] = useState(initialValue)
  const [range, setRange] = useState({ minDate: null, maxDate: null })

  const fullOptions = allowCustom
    ? [...options, { id: 'CUSTOM', name: 'Custom Range', value: { minDate: null, maxDate: null } }]
    : options

  const isCustom = innerValue === 'CUSTOM'

  return (
    <>
      <FormControl sx={{ width: '100%' }} variant="standard" size="small">
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Stack direction="column" spacing={2} sx={{ width: '100%' }}>
            <InputLabel id="select-period">{formatMessage(messages.period)}</InputLabel>
            <Select
              labelId="select-period"
              value={innerValue}
              onChange={e => {
                setInnerValue(e.target.value)
                if (e.target.value !== 'CUSTOM') {
                  onChange(options.filter(o => o.id === e.target.value)[0].value)
                }
              }}
            >
              {fullOptions.map(o => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </Stack>
          {isCustom ? (
            <>
              <DesktopDatePicker
                label="From"
                value={range.minDate}
                onChange={minDate => {
                  if (range.maxDate !== null) {
                    setRange({ ...range, minDate })
                    onChange({
                      minDate: minDate.toISOString().split('T')[0],
                      maxDate: range.maxDate.toISOString().split('T')[0],
                    })
                  } else {
                    setRange({ ...range, minDate })
                  }
                }}
                renderInput={params => <TextField {...params} />}
              />
              <DesktopDatePicker
                label="To"
                value={range.maxDate}
                minDate={range.minDate}
                onChange={maxDate => {
                  if (range.minDate !== null) {
                    setRange({ ...range, maxDate })
                    onChange({
                      minDate: range.minDate.toISOString().split('T')[0],
                      maxDate: maxDate.toISOString().split('T')[0],
                    })
                  } else {
                    setRange({ ...range, maxDate })
                  }
                }}
                renderInput={params => <TextField {...params} />}
              />
            </>
          ) : null}
        </Stack>
      </FormControl>
    </>
  )
}

export default PeriodSelector

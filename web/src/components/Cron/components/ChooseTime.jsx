import React from 'react'
import { MenuItem, Select } from '@mui/material'
import Stack from '@mui/material/Stack'
import { range } from 'ramda'
import useI18n from '../../../hooks/useI18n'
import { cronMessages as messages } from '../../../messages/index'

const ChooseTime = ({ hour, minute, changeHours, changeMinutes, disabled }) => {
  const { formatMessage } = useI18n()

  return (
    <Stack direction="row" spacing={1} alignItems="center" style={{ marginBottom: 8 }}>
      <Select
        value={parseInt(hour || 0, 10)}
        onChange={changeHours}
        disabled={disabled}
        variant="standard"
        label={formatMessage(messages.startTime)}
      >
        {range(0, 24).map(m => (
          <MenuItem key={m} id={m} value={m}>
            {m.toString().length < 2 ? `0${m}` : m}
          </MenuItem>
        ))}
      </Select>
      <Select
        value={parseInt(minute || 0, 10)}
        onChange={changeMinutes}
        disabled={disabled}
        variant="standard"
        label={formatMessage(messages.startTime)}
      >
        {range(0, 60).map(m => (
          <MenuItem key={m} id={m} value={m}>
            {m.toString().length < 2 ? `0${m}` : m}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  )
}

export default ChooseTime

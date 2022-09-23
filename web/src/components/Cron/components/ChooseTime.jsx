import React from 'react'
import { MenuItem, Select } from '@mui/material'
import Typography from '@mui/material/Typography'
import { range } from 'ramda'
import useI18n from '../../../hooks/useI18n'
import { cronMessages as messages } from '../../../messages/index'

const ChooseTime = ({ hour, minute, changeHours, changeMinutes, disabled }) => {
  const { formatMessage } = useI18n()

  return (
    <>
      <Typography variant="subtitle2">{formatMessage(messages.startTime)}</Typography>

      <Select value={parseInt(hour || 0, 10)} onChange={changeHours} disabled={disabled} margin="none">
        {range(0, 24).map(m => (
          <MenuItem key={m} id={m} value={m}>
            {m.toString().length < 2 ? `0${m}` : m}
          </MenuItem>
        ))}
      </Select>
      <Select value={parseInt(minute || 0, 10)} onChange={changeMinutes} margin="none" disabled={disabled}>
        {range(0, 60).map(m => (
          <MenuItem key={m} id={m} value={m}>
            {m.toString().length < 2 ? `0${m}` : m}
          </MenuItem>
        ))}
      </Select>
    </>
  )
}

export default ChooseTime

import React from 'react'
import { MenuItem, Select } from '@mui/material'
import Typography from '@mui/material/Typography'
import { range } from 'ramda'

const ChooseTime = ({ hour, minute, changeHours, changeMinutes, disabled }) => {
  return (
    <>
      <Typography variant="subtitle2">Start time</Typography>

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

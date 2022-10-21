import React from 'react'
import { MenuItem, TextField, Stack } from '@mui/material'
import classNames from 'classnames/bind'
import { range } from 'ramda'
import useI18n from '../../../hooks/useI18n'
import { cronMessages as messages } from '../../../messages/index'
import styles from '../styles.css'

const classes = classNames.bind(styles)

const ChooseTime = ({ hour, minute, changeHours, changeMinutes, disabled }) => {
  const { formatMessage } = useI18n()

  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" className={classes('Input_Wrapper')}>
      <TextField
        select
        value={parseInt(hour || 0, 10)}
        onChange={changeHours}
        disabled={disabled}
        variant="standard"
        className={classes('Input_Width')}
        label={formatMessage(messages.hours)}
      >
        {range(0, 24).map(m => (
          <MenuItem key={m} id={m} value={m}>
            {m.toString().length < 2 ? `0${m}` : m}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        value={parseInt(minute || 0, 10)}
        onChange={changeMinutes}
        disabled={disabled}
        variant="standard"
        className={classes('Input_Width')}
        label={formatMessage(messages.minutes)}
      >
        {range(0, 60).map(m => (
          <MenuItem key={m} id={m} value={m}>
            {m.toString().length < 2 ? `0${m}` : m}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}

export default ChooseTime

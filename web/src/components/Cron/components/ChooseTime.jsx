import React from 'react'
import { MenuItem, TextField, Stack } from '@mui/material'
import classNames from 'classnames/bind'
import padStart from 'lodash/padStart'
import { range } from 'ramda'
import useI18n from '../../../hooks/useI18n'
import { cronMessages as messages } from '../../../messages/index'
import styles from '../styles.css'

const classes = classNames.bind(styles)

const MINUTES = range(0, 4).map(m => ({
  key: m,
  value: m * 15,
}))

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
            {padStart(m.toString(), 2, '0')}
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
        {MINUTES.map(({ key, value }) => (
          <MenuItem key={key} id={key} value={value}>
            {padStart(value.toString(), 2, '0')}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}

export default ChooseTime

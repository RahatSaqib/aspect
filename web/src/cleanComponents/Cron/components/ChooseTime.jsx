import React from 'react'
import { MenuItem, TextField, Stack } from '@mui/material'
import padStart from 'lodash/padStart'
import { useIntl } from 'react-intl'
import { cronMessages as messages } from '../../../messages/index'
import styles from '../styles.module.css'

function range(start, end) {
  return Array.from(Array(end - start).keys()).map(i => i + start)
}

const MINUTES = range(0, 60).map(m => ({
  key: m,
  value: m,
}))

const ChooseTime = ({ hour, minute, changeHours, changeMinutes, disabled }) => {
  const { formatMessage } = useIntl()

  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" className={styles.Input_Wrapper}>
      <TextField
        select
        value={parseInt(hour || 0, 10)}
        onChange={changeHours}
        disabled={disabled}
        variant="standard"
        className={styles.Input_Width}
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
        className={styles.Input_Width}
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

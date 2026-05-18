import React, { useState } from 'react'
import { FormControlLabel, FormGroup, Radio, Stack, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'
import styles from './styles.module.css'

const Monthly = ({ cronExpression, onChange }) => {
  const [every] = useState('1')
  const { formatMessage } = useIntl()

  const onDayChange = e => {
    if ((parseInt(e.target.value, 10) > 0 && parseInt(e.target.value, 10) <= 31) || e.target.value === '') {
      const val = [
        cronExpression[0] === '*' ? '0' : cronExpression[0],
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2],
        '*/1',
        '*',
      ]
      val[2] = `${e.target.value}`
      onChange(val)
    }
  }
  const onLastDayChange = e => {
    if ((parseInt(e.target.value, 10) > 0 && parseInt(e.target.value, 10) <= 31) || e.target.value === '') {
      const val = [
        cronExpression[0] === '*' ? '0' : cronExpression[0],
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2],
        '*/1',
        '*',
      ]
      if (e.target.value === '') {
        val[2] = ''
      } else {
        val[2] = `L-${e.target.value}`
      }

      onChange(val)
    }
  }
  const onAtHourChange = e => {
    const val = [...cronExpression]
    val[1] = `${e.target.value}`
    onChange(val)
  }
  const onAtMinuteChange = e => {
    const val = [...cronExpression]
    val[0] = `${e.target.value}`
    onChange(val)
  }

  return (
    <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <div className={styles.Content}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <FormGroup>
                <FormControlLabel
                  control={<Radio color="primary" value="1" checked />}
                  label={formatMessage(messages.dayOfEveryMonth)}
                />
              </FormGroup>
            </Stack>
            <Stack direction="column" spacing={2} alignItems="flex-end" justifyContent="flex-end" />
          </Stack>
        </div>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {every === '1' ? (
          <TextField
            id="outlined-number"
            label={formatMessage(messages.dayOfEveryMonth)}
            value={cronExpression[2]}
            onChange={onDayChange}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
          />
        ) : null}
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {every === '4' ? (
            <TextField
              id="outlined-number"
              label={formatMessage(messages.daysBeforeEndMonth)}
              value={cronExpression[3].split('-')[1]}
              onChange={onLastDayChange}
              type="number"
              className={styles.Input_Width}
              InputLabelProps={{ readOnly: every !== '4', shrink: true }}
              margin="normal"
              disabled={every !== '4'}
            />
          ) : null}
          <ChooseTime
            hour={cronExpression[1]}
            minute={cronExpression[0]}
            changeHours={onAtHourChange}
            changeMinutes={onAtMinuteChange}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default Monthly

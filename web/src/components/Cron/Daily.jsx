import React, { useState, useEffect } from 'react'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Radio from '@mui/material/Radio'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import classNames from 'classnames/bind'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'
import styles from './styles.css'

const classes = classNames.bind(styles)

const Daily = ({ cronExpression, onChange }) => {
  const [every, setEvery] = useState(true)
  const { formatMessage } = useI18n()

  useEffect(() => setEvery(cronExpression[3] !== '?'), [cronExpression])

  const onDayChange = e => {
    if ((e.target.value > 0 && e.target.value < 32) || e.target.value === '') {
      const val = [
        '0',
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2] === '*' ? '0' : cronExpression[2],
        '*',
        '*',
        '?',
        '*',
      ]
      if (e.target.value === '') {
        val[3] = ''
      } else {
        val[3] = `1/${e.target.value}`
      }

      onChange(val)
    }
  }
  const changeHours = e => {
    const val = [...cronExpression]
    val[2] = `${e.target.value}`
    onChange(val)
  }
  const changeMinutes = e => {
    const val = [...cronExpression]
    val[1] = `${e.target.value}`
    onChange(val)
  }

  return (
    <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
      <div className={classes('Content')}>
        <FormGroup row>
          <FormControlLabel
            control={
              <Radio
                color="primary"
                value="1"
                onChange={() => {
                  setEvery(true)
                }}
                checked={every}
              />
            }
            label={formatMessage(messages.everyDay)}
          />
          <FormControlLabel
            control={
              <Radio
                color="primary"
                value="4"
                onChange={() => {
                  setEvery(false)
                  onChange(['0', cronExpression[1], cronExpression[2], '?', '*', 'MON-FRI', '*'])
                }}
                checked={!every}
              />
            }
            label={formatMessage(messages.everyWeekDay)}
          />
        </FormGroup>
      </div>
      <Stack direction="row" spacing={1} alignItems="center">
        {every ? (
          <TextField
            id="outlined-number"
            label={formatMessage(messages.everyDay)}
            value={cronExpression[3].split('/')[1] ? cronExpression[3].split('/')[1] : ''}
            onChange={onDayChange}
            type="number"
            InputLabelProps={{ disabled: !every, shrink: true }}
            margin="normal"
            disabled={!every}
          />
        ) : (
          <ChooseTime
            hour={cronExpression[2]}
            minute={cronExpression[1]}
            changeMinutes={changeMinutes}
            changeHours={changeHours}
            disabled={every}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default Daily

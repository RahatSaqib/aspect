import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'

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
    <>
      <Card style={{ padding: 10, margin: 10 }}>
        <Radio
          checked={!!every}
          onClick={() => setEvery(true)}
          value="1"
          name="DailyRadio"
          inputProps={{ 'aria-label': 'DailyRadio' }}
        />
        <TextField
          id="outlined-number"
          label={formatMessage(messages.everyDay)}
          value={cronExpression[3].split('/')[1] ? cronExpression[3].split('/')[1] : ''}
          onChange={onDayChange}
          type="number"
          InputLabelProps={{ disabled: !every, shrink: true }}
          margin="normal"
          variant="outlined"
        />
      </Card>

      <Card style={{ padding: 10, margin: 10 }}>
        <FormControlLabel
          value="top"
          control={
            <Radio
              onClick={() => {
                setEvery(false)
                onChange(['0', cronExpression[1], cronExpression[2], '?', '*', 'MON-FRI', '*'])
              }}
              value="2"
              name="DailyRadio"
              checked={!every}
              inputProps={{ 'aria-label': 'DailyRadio' }}
            />
          }
          label={formatMessage(messages.everyWeekDay)}
        />
        <CardContent>
          <ChooseTime
            hour={cronExpression[2]}
            minute={cronExpression[1]}
            changeMinutes={changeMinutes}
            changeHours={changeHours}
            disabled={every}
          />
        </CardContent>
      </Card>
    </>
  )
}

export default Daily

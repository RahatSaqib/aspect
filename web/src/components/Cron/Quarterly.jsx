import React, { useState } from 'react'
import { CardContent } from '@mui/material'
import Card from '@mui/material/Card'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'

const Quarterly = ({ cronExpression, onChange }) => {
  const [every, setEvery] = useState('1')
  const [disabled, setDisabled] = useState(true)
  const { formatMessage } = useI18n()

  const onDayChange = e => {
    if ((parseInt(e.target.value, 10) > 0 && parseInt(e.target.value, 10) <= 31) || e.target.value === '') {
      const val = [
        '0',
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2] === '*' ? '0' : cronExpression[2],
        cronExpression[3],
        '*/3',
        '?',
        '*',
      ]
      val[3] = `${e.target.value}`
      onChange(val)
    }
  }
  const onLastDayChange = e => {
    if ((parseInt(e.target.value, 10) > 0 && parseInt(e.target.value, 10) <= 31) || e.target.value === '') {
      const val = [
        '0',
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2] === '*' ? '0' : cronExpression[2],
        cronExpression[3],
        '*/3',
        '?',
        '*',
      ]
      if (e.target.value === '') {
        val[3] = ''
      } else {
        val[3] = `L-${e.target.value}`
      }

      onChange(val)
    }
  }
  const onAtHourChange = e => {
    const val = [...cronExpression]
    val[2] = `${e.target.value}`
    onChange(val)
  }
  const onAtMinuteChange = e => {
    const val = [...cronExpression]
    val[1] = `${e.target.value}`
    onChange(val)
  }

  const onMonthlyChange = e => {
    setEvery(e.target.value)
    onChange([
      '0',
      cronExpression[1] === '*' ? '0' : cronExpression[1],
      cronExpression[2] === '*' ? '0' : cronExpression[2],
      '1',
      '*/3',
      '?',
      '*',
    ])
  }
  return (
    <>
      <Card style={{ padding: 10, margin: 10 }}>
        <Radio
          onChange={onMonthlyChange}
          value="1"
          name="MonthlyRadio"
          checked={every === '1'}
          inputProps={{ 'aria-label': 'DailyRadio' }}
        />
        &nbsp;&nbsp;
        <TextField
          id="outlined-number"
          label={formatMessage(messages.dayOfEveryQuarter)}
          value={cronExpression[3]}
          onChange={onDayChange}
          type="number"
          disabled={every !== '1'}
          InputLabelProps={{
            readOnly: every !== '1',
            shrink: true,
          }}
          margin="normal"
          variant="outlined"
        />
      </Card>

      <Card style={{ padding: 10, margin: 10 }}>
        <FormControlLabel
          value="top"
          control={
            <Radio
              onChange={e => {
                setEvery(e.target.value)
                onChange([
                  '0',
                  cronExpression[1] === '*' ? '0' : cronExpression[1],
                  cronExpression[2] === '*' ? '0' : cronExpression[2],
                  'L',
                  '*/3',
                  '?',
                  '*',
                ])
              }}
              value="2"
              name="DailyRadio"
              checked={every === '2'}
              inputProps={{ 'aria-label': 'DailyRadio' }}
            />
          }
          label={formatMessage(messages.lastDayofQuarter)}
        />
      </Card>

      <Card style={{ padding: 10, margin: 10 }}>
        <Radio
          onChange={e => {
            setEvery(e.target.value)
            setDisabled(!disabled)
            onChange([
              '0',
              cronExpression[1] === '*' ? '0' : cronExpression[1],
              cronExpression[2] === '*' ? '0' : cronExpression[2],
              `L-${1}`,
              '*/3',
              '?',
              '*',
            ])
          }}
          value="4"
          name="MonthlyRadio"
          checked={every === '4'}
          inputProps={{ 'aria-label': 'MonthlyRadio' }}
        />
        <TextField
          id="outlined-number"
          label={formatMessage(messages.daysBeforeEndQuarter)}
          value={cronExpression[3].split('-')[1]}
          onChange={onLastDayChange}
          type="number"
          InputLabelProps={{
            readOnly: every !== '4',
            shrink: true,
          }}
          disabled={every !== '4'}
          margin="normal"
          variant="outlined"
        />
        <CardContent>
          <ChooseTime
            hour={cronExpression[2]}
            minute={cronExpression[1]}
            changeHours={onAtHourChange}
            changeMinutes={onAtMinuteChange}
            disabled={every !== '4'}
          />
        </CardContent>
      </Card>
    </>
  )
}

export default Quarterly

import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import ChooseTime from './components/ChooseTime'

const Monthly = ({ cronExpression, onChange }) => {
  const [every, setEvery] = useState()

  useEffect(() => {
    if (cronExpression[3] === 'L') setEvery('2')
    else if (cronExpression[3] === 'LW') setEvery('3')
    else if (cronExpression[3].startsWith('L')) setEvery('4')
    else setEvery('2')
  }, [cronExpression])

  const onDayChange = e => {
    if ((parseInt(e.target.value, 10) > 0 && parseInt(e.target.value, 10) <= 31) || e.target.value === '') {
      const val = [
        '0',
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2] === '*' ? '0' : cronExpression[2],
        cronExpression[3],
        '1/1',
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
        '1/1',
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
      '1/1',
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
          label="Day of every month(s)"
          value={cronExpression[3]}
          onChange={onDayChange}
          type="number"
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
                  '*',
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
          label="Last day of every month"
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
                  'LW',
                  '*',
                  '?',
                  '*',
                ])
              }}
              value="3"
              name="DailyRadio"
              checked={every === '3'}
              inputProps={{ 'aria-label': 'DailyRadio' }}
            />
          }
          label="On the last weekday of every month"
        />
      </Card>
      <Card style={{ padding: 10, margin: 10 }}>
        <Radio
          onChange={e => {
            setEvery(e.target.value)
            onChange([
              '0',
              cronExpression[1] === '*' ? '0' : cronExpression[1],
              cronExpression[2] === '*' ? '0' : cronExpression[2],
              `L-${1}`,
              '*',
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
          label="Day(s) before the end of the month"
          value={cronExpression[3].split('-')[1]}
          onChange={onLastDayChange}
          type="number"
          InputLabelProps={{
            readOnly: every !== '4',
            shrink: true,
          }}
          margin="normal"
          variant="outlined"
        />
      </Card>

      <ChooseTime
        hour={cronExpression[2]}
        minute={cronExpression[1]}
        onAtMinuteChange={onAtMinuteChange}
        onAtHourChange={onAtHourChange}
      />
    </>
  )
}

export default Monthly

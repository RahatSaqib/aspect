import React, { useState } from 'react'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'

const Monthly = ({ cronExpression, onChange }) => {
  const [every, setEvery] = useState('1')
  const { formatMessage } = useI18n()

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

  return (
    <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <div style={{ marginLeft: 12 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      type="checkbox"
                      value="1"
                      onChange={() => {
                        setEvery('1')
                        onChange([
                          '0',
                          cronExpression[1] === '*' ? '0' : cronExpression[1],
                          cronExpression[2] === '*' ? '0' : cronExpression[2],
                          '1',
                          '1/1',
                          '?',
                          '*',
                        ])
                      }}
                      checked={every === '1'}
                    />
                  }
                  label={formatMessage(messages.dayOfEveryMonth)}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      type="checkbox"
                      value="4"
                      onChange={() => {
                        setEvery('4')
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
                      checked={every === '4'}
                    />
                  }
                  label={formatMessage(messages.daysBeforeEndMonth)}
                />
              </FormGroup>
            </Stack>
            <Stack direction="column" spacing={2} alignItems="flex-end" justifyContent="flex-end">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      type="checkbox"
                      value="2"
                      onChange={() => {
                        setEvery('2')
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
                      checked={every === '2'}
                    />
                  }
                  label={formatMessage(messages.lastDayOfMonth)}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      type="checkbox"
                      value="3"
                      onChange={() => {
                        setEvery('3')
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
                      checked={every === '3'}
                    />
                  }
                  label={formatMessage(messages.lastWeekdayOfmonth)}
                />
              </FormGroup>
            </Stack>
          </Stack>
        </div>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {every === '1' ? (
          <TextField
            id="outlined-number"
            label={formatMessage(messages.dayOfEveryMonth)}
            value={cronExpression[3]}
            onChange={onDayChange}
            type="number"
            InputLabelProps={{
              readOnly: every !== '1',
              shrink: true,
            }}
            margin="normal"
            disabled={every !== '1'}
          />
        ) : null}

        {every === '4' ? (
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField
              id="outlined-number"
              label={formatMessage(messages.daysBeforeEndMonth)}
              value={cronExpression[3].split('-')[1]}
              onChange={onLastDayChange}
              type="number"
              style={{ width: 200 }}
              InputLabelProps={{ readOnly: every !== '4', shrink: true }}
              margin="normal"
              disabled={every !== '4'}
            />
            <ChooseTime
              hour={cronExpression[2]}
              minute={cronExpression[1]}
              changeHours={onAtHourChange}
              changeMinutes={onAtMinuteChange}
            />
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  )
}

export default Monthly

import React, { useState } from 'react'
import { FormControlLabel, FormGroup, Radio, Stack, TextField } from '@mui/material'
import classNames from 'classnames/bind'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'
import styles from './styles.css'

const classes = classNames.bind(styles)

const Monthly = ({ cronExpression, onChange }) => {
  const [every] = useState('1')
  const { formatMessage } = useI18n()

  const onDayChange = e => {
    if ((parseInt(e.target.value, 10) > 0 && parseInt(e.target.value, 10) <= 31) || e.target.value === '') {
      const val = [
        cronExpression[0] === '*' ? '0' : cronExpression[0],
        cronExpression[1] === '*' ? '0' : cronExpression[1],
        cronExpression[2],
        '1/1',
        '?',
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
        '1/1',
        '?',
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
        <div className={classes('Content')}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Radio
                      color="primary"
                      value="1"
                      // onChange={() => {
                      //   onChange([
                      //     cronExpression[0] === '*' ? '0' : cronExpression[0],
                      //     cronExpression[1] === '*' ? '0' : cronExpression[1],
                      //     '1',
                      //     '1/1',
                      //     '*',
                      //   ])
                      // }}
                      checked
                    />
                  }
                  label={formatMessage(messages.dayOfEveryMonth)}
                />

                {/* <FormControlLabel
                  control={
                    <Radio
                      color="primary"
                      value="4"
                      onChange={() => {
                        setEvery('4')
                        onChange([
                          cronExpression[0] === '*' ? '0' : cronExpression[0],
                          cronExpression[1] === '*' ? '0' : cronExpression[1],
                          `L-${1}`,
                          '*',
                          '*',
                        ])
                      }}
                      checked={every === '4'}
                    />
                  }
                  label={formatMessage(messages.daysBeforeEndMonth)}
                /> */}
              </FormGroup>
            </Stack>
            <Stack direction="column" spacing={2} alignItems="flex-end" justifyContent="flex-end">
              {/* <FormGroup>
                <FormControlLabel
                  control={
                    <Radio
                      color="primary"
                      value="2"
                      onChange={() => {
                        setEvery('2')
                        onChange([
                          '0',
                          cronExpression[0] === '*' ? '0' : cronExpression[0],
                          cronExpression[1] === '*' ? '0' : cronExpression[1],
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
                    <Radio
                      color="primary"
                      value="3"
                      onChange={() => {
                        setEvery('3')
                        onChange([
                          '0',
                          cronExpression[0] === '*' ? '0' : cronExpression[0],
                          cronExpression[1] === '*' ? '0' : cronExpression[1],
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
              </FormGroup> */}
            </Stack>
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
              // readOnly: every !== '1',
              shrink: true,
            }}
            margin="normal"
            // disabled={every !== '1'}
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
              className={classes('Input_Width')}
              InputLabelProps={{ readOnly: every !== '4', shrink: true }}
              margin="normal"
              disabled={every !== '4'}
            />
            <ChooseTime
              hour={cronExpression[1]}
              minute={cronExpression[0]}
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

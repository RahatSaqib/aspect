import React, { useState, useEffect } from 'react'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
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
    <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">{formatMessage(messages.everyWeekDay)}</Typography>
        <AntSwitch
          checked={!!every}
          inputProps={{ 'aria-label': 'ant design' }}
          onChange={() => {
            if (every) {
              // weekly
              setEvery(false)
              onChange(['0', cronExpression[1], cronExpression[2], '?', '*', 'MON-FRI', '*'])
            } else {
              // daily
              setEvery(!every)
            }
          }}
        />
        <Typography variant="subtitle2">{formatMessage(messages.everyDay)}</Typography>
      </Stack>
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

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#177ddc' : '#1890ff',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
  },
}))

export default Daily

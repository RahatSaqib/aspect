import * as React from 'react'
import { Stack, InputLabel, Switch } from '@mui/material'
import { styled } from '@mui/material/styles'

const CustomSwitch = styled(Switch)(({ theme }) => ({
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

const LabeledSwitch = ({ offLabel, onLabel, id, name, label, value, onChange, disabled }) => {
  return (
    <>
      <InputLabel shrink>{label}</InputLabel>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <InputLabel shrink>{offLabel}</InputLabel>
        <CustomSwitch id={id} name={name} checked={value} disabled={disabled} onChange={onChange} />
        <InputLabel shrink>{onLabel}</InputLabel>
      </Stack>
    </>
  )
}

export default LabeledSwitch

import React from 'react'
import { Typography } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import { cronMessages as messages } from '../../../messages/index'

export default function DisplayCard({ textResult, cronResult }) {
  const { formatMessage } = useI18n()

  return (
    <Typography>
      {textResult ? `${formatMessage(messages.execute)}: ${textResult} ` : ''}
      {cronResult ? `(${cronResult})` : ''}
    </Typography>
  )
}

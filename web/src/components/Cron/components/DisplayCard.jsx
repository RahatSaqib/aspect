import React from 'react'
import { Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { cronMessages as messages } from '../../../messages/index'

export default function DisplayCard({ textResult, cronResult }) {
  const { formatMessage } = useIntl()

  return (
    <Typography>
      {textResult ? `${formatMessage(messages.execute)}: ${textResult} ` : ''}
      {cronResult ? `(${cronResult})` : ''}
    </Typography>
  )
}

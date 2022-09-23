import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'

export default function DisplayCard({ textResult, cronResult }) {
  const { formatMessage } = useI18n()

  return (
    <Card style={{ padding: 10, margin: 10 }}>
      <CardContent>
        <Typography>
          {textResult ? `${formatMessage(messages.execute)}: ${textResult}` : ''}
          <br />
          {cronResult ? ` ${cronResult}` : ''}
          <br />
        </Typography>
      </CardContent>
    </Card>
  )
}

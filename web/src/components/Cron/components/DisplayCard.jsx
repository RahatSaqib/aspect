import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export default function DisplayCard({ textResult, cronResult }) {
  return (
    <Card style={{ padding: 10, margin: 10 }}>
      <Typography component="h5" variant="h5">
        Execute At:{' '}
      </Typography>
      <CardContent>
        {textResult && (
          <Typography variant="subtitle1" color="textSecondary">
            {textResult}
          </Typography>
        )}
        {cronResult && (
          <Typography variant="subtitle1" color="textSecondary">
            Cron: {cronResult}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

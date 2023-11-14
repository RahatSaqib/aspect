import React from 'react'
import { Box, Button } from '@mui/material'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import messages from './messages'

export function DataCell({ patientId, sampleId, reportName, resultId }) {
  const intl = useIntl()
  const navigate = useNavigate()

  if (reportName) return <Box>{`${intl.formatMessage(messages.reportName)}: ${reportName}`}</Box>
  return (
    <Box>
      {patientId ? <Box>{`${intl.formatMessage(messages.patientId)}: ${patientId}`}</Box> : null}
      {sampleId ? <Box>{`${intl.formatMessage(messages.sampleId)}: ${sampleId}`}</Box> : null}
      {resultId ? (
        <Button onClick={() => navigate(`/browse/result/${resultId}`)} variant="text" sx={{ p: 0 }}>
          {intl.formatMessage(messages.clickToResult)}
        </Button>
      ) : null}
    </Box>
  )
}

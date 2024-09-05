import React, { Fragment } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { FaDownload, FaHourglassStart } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'

function ReportAction(props) {
  const { onClickReportSubmit, report, fileExtension, requestType = 'download' } = props

  const label = fileExtension === 'xlsx' ? 'Excel' : 'CSV'

  return (
    <Button
      sx={{ marginX: 1 }}
      size="small"
      color="primary"
      onClick={() => onClickReportSubmit({ report, fileExtension, requestType })}
    >
      {requestType === 'download' && (
        <>
          {' '}
          <FaDownload style={{ marginRight: 4 }} />
          Download {label}
        </>
      )}
      {requestType === 'generate' && (
        <>
          <FiRefreshCw style={{ marginRight: 4 }} /> Generate {label}
        </>
      )}
      {requestType === 'processing' && (
        <>
          <FaHourglassStart style={{ marginRight: 4 }} /> Processing {label}
        </>
      )}
    </Button>
  )
}

function findFinalRequestType(reportRequestsData) {
  if (reportRequestsData.length === 0) return 'generate'
  if (reportRequestsData.some(r => r.status === 'queued')) return 'processing'
  return 'download'
}

export function ReportActions(props) {
  const { report, reportRequests } = props
  const { data = [], isLoading } = reportRequests

  const csvRequestType = findFinalRequestType(data.filter(r => r.reportFormat === 'csv'))
  const xlsxRequestType = findFinalRequestType(data.filter(r => r.reportFormat === 'xlsx'))
  return (
    <Box>
      {report.exportExcel === 1 && <ReportAction {...props} fileExtension="xlsx" requestType={xlsxRequestType} />}
      {report.exportCsv === 1 && <ReportAction {...props} fileExtension="csv" requestType={csvRequestType} />}
      <Typography variant="body2" fontSize={12} marginLeft={2} marginTop={1}>
        The report you are downloading was generated 3 minutes ago
      </Typography>
    </Box>
  )
}

import React from 'react'
import { Box, Button, Skeleton, Tooltip } from '@mui/material'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { FaDownload, FaHourglassStart } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'

function ReportAction(props) {
  const { onClickReportSubmit, report, reportRequests, fileExtension } = props

  const { data: reportRequestsData = [], isLoading, isSubmitting } = reportRequests

  const label = fileExtension === 'xlsx' ? 'Excel' : 'CSV'

  const requestType = findFinalRequestType(reportRequestsData.filter(r => r.reportFormat === fileExtension))

  const reportRequest = reportRequestsData
    .filter(r => r.reportFormat === fileExtension)
    .find(r => {
      if (requestType === 'generate') return true
      if (requestType === 'download') return r.status === 'ready'
      return r.status === 'queued'
    })

  let buttonContent
  if (requestType === 'download') {
    buttonContent = (
      <Tooltip title="The report you are downloading was generated 3 minutes ago" placement="top">
        <Box>
          {' '}
          <FaDownload style={{ marginRight: 4 }} />
          Download {label}
        </Box>
      </Tooltip>
    )
  } else if (requestType === 'generate') {
    buttonContent = (
      <>
        <FiRefreshCw style={{ marginRight: 4 }} /> Generate {label}
      </>
    )
  } else if (requestType === 'processing') {
    buttonContent = (
      <Tooltip
        title={
          reportRequest?.createdOn
            ? `Request is in progress and it was started ${formatDistanceToNow(parseISO(reportRequest.createdOn), {
                addSuffix: true,
              })}`
            : null
        }
        placement="top"
      >
        <Box>
          <FaHourglassStart style={{ marginRight: 4 }} /> Processing {label}
        </Box>
      </Tooltip>
    )
  }

  return (
    <Button
      sx={{ paddingX: 2, paddingY: 1, cursor: requestType !== 'processing' ? 'pointer' : 'not-allowed' }}
      size="small"
      color="primary"
      disabled={isSubmitting || isLoading}
      onClick={() => onClickReportSubmit({ report, fileExtension, requestType, requestId: reportRequest?.requestId })}
    >
      {isSubmitting || isLoading ? <Skeleton width="100%" /> : buttonContent}
    </Button>
  )
}

function findFinalRequestType(reportRequestsData) {
  if (reportRequestsData.length === 0) return 'generate'
  if (reportRequestsData.some(r => r.status === 'ready')) return 'download'
  return 'processing'
}

export function ReportActions(props) {
  const { report, reportRequests, onClickReportSubmit } = props
  const { data = [] } = reportRequests

  const csvRequestType = findFinalRequestType(data.filter(r => r.reportFormat === 'csv'))
  const xlsxRequestType = findFinalRequestType(data.filter(r => r.reportFormat === 'xlsx'))
  return (
    <Box>
      {report.exportExcel === 1 && (
        <ReportAction
          report={report}
          onClickReportSubmit={onClickReportSubmit}
          reportRequests={reportRequests}
          fileExtension="xlsx"
          requestType={xlsxRequestType}
        />
      )}
      {report.exportCsv === 1 && (
        <ReportAction
          report={report}
          onClickReportSubmit={onClickReportSubmit}
          reportRequests={reportRequests}
          fileExtension="csv"
          requestType={csvRequestType}
        />
      )}
    </Box>
  )
}

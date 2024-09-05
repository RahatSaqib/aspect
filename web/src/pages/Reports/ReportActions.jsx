import React, { Fragment } from 'react'
import { Button } from '@mui/material'

export function ReportActions(props) {
  const { report, onClickSubmitAsyncReportRequest, asyncRequests } = props
  return (
    <Fragment>
      {report.exportExcel === 1 && (
        <Button
          sx={{ marginX: 1 }}
          size="small"
          color="primary"
          onClick={() => onClickSubmitAsyncReportRequest({ report, fileExtension: 'xlsx' })}
        >
          {asyncRequests?.find(({ status }) => status === 'complete') ? 'Download' : 'Generate'} Excel
        </Button>
      )}
      {report.exportCsv === 1 && (
        <Button
          sx={{ marginX: 1 }}
          size="small"
          color="primary"
          onClick={() => onClickSubmitAsyncReportRequest({ report, fileExtension: 'csv' })}
        >
          {asyncRequests?.find(({ status }) => status === 'complete') ? 'Download' : 'Generate'} CSV
        </Button>
      )}
    </Fragment>
  )
}

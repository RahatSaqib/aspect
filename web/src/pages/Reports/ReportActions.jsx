import React, { Fragment } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { FaDownload, FaHourglassStart } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'

const randomness = () => (Math.random() >= 0.3 ? false : Math.random() >= 0.5 ? true : null)

export function ReportActions(props) {
  const { report, onClickSubmitAsyncReportRequest, asyncRequests } = props
  const randomValue1 = randomness()
  const randomValue2 = randomness()
  return (
    <Box>
      {report.exportExcel === 1 && (
        <Button
          sx={{ marginX: 1 }}
          size="small"
          color="primary"
          onClick={() => onClickSubmitAsyncReportRequest({ report, fileExtension: 'xlsx' })}
        >
          {randomValue1 === true && (
            <>
              {' '}
              <FaDownload style={{ marginRight: 4 }} />
              Download Excel
            </>
          )}
          {randomValue1 === false && (
            <>
              <FiRefreshCw style={{ marginRight: 4 }} /> Generate Excel
            </>
          )}
          {randomValue1 === null && (
            <>
              <FaHourglassStart style={{ marginRight: 4 }} /> Processing Excel
            </>
          )}
        </Button>
      )}
      {report.exportCsv === 1 && (
        <Button
          sx={{ marginX: 1 }}
          size="small"
          color="primary"
          onClick={() => onClickSubmitAsyncReportRequest({ report, fileExtension: 'csv' })}
        >
          {randomValue2 === true && (
            <>
              {' '}
              <FaDownload style={{ marginRight: 4 }} />
              Download CSV
            </>
          )}
          {randomValue2 === false && (
            <>
              <FiRefreshCw style={{ marginRight: 4 }} /> Generate CSV
            </>
          )}
          {randomValue2 === null && (
            <>
              <FaHourglassStart style={{ marginRight: 4 }} /> Processing CSV
            </>
          )}
        </Button>
      )}
      <Typography variant="body2" fontSize={12} marginLeft={2} marginTop={1}>
        The report you are downloading was generated 3 minutes ago
      </Typography>
    </Box>
  )
}

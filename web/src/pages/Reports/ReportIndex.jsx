import React, { useState, useEffect } from 'react'
import { Alert, Box, Button, Grid, LinearProgress, List, ListItem } from '@mui/material'
import groupBy from 'lodash/groupBy'
import { Helmet } from 'react-helmet'
import { FaDownload, FaHourglassStart } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'
import { useIdleTimerContext } from 'react-idle-timer'
import { defineMessages, useIntl } from 'react-intl'
import { useQuery, useMutation } from 'react-query'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DetailHeader, ReportsFilter } from '../../components'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { REPORT_LIST } from '../../components/QueryFetch/Report/index'
import useFilterValues from '../../hooks/useFilterValues'
import messages from '../../messages/report'
import { showError } from '../../store/AppNotificationRedux'
import { safeDownloadFile } from '../../utils/utils/files'
import { asyncReportsFeatureEnabled } from './constants'
import { ReportActions } from './ReportActions'
import ReportCard from './ReportCard'
import { ReportRecentRequests } from './ReportRecentRequests'
import styles from './styles.module.css'

const getFileType = fileExtension => (fileExtension === 'xlsx' ? 'Excel' : 'CSV')

const getTooMuchDataMessage = (reportName, fileExtension) => ({
  severity: 'error',
  resolution: messages.tooMuchDataErrorMessage,
  title: messages.genericReportErrorTitle,
  messageValues: {
    reportName,
    fileType: getFileType(fileExtension),
  },
})

const getGenericErrorMessage = (error, reportName, fileExtension) => ({
  severity: 'error',
  resolution: messages.genericReportErrorMessage,
  title: messages.genericReportErrorTitle,
  messageValues: {
    reportName,
    errorMessage: error.message,
    fileType: getFileType(fileExtension),
  },
})

const getCustomErrorNotifications = (fileExtension, reportName) => ({
  502: getTooMuchDataMessage(reportName, fileExtension),
  504: getTooMuchDataMessage(reportName, fileExtension),
  default: error => getGenericErrorMessage(error, reportName, fileExtension),
})

const getDateRangeValidationError = reportName => ({
  severity: 'warning',
  ...defineMessages({
    resolution: {
      id: 'report.missingDateRangeFilterDescription',
      defaultMessage: `To download the report "{reportName}" you must select a date from the filters.`,
    },
    title: {
      id: 'report.missingDateRangeFilterTitle',
      defaultMessage: 'Error: Date Selection Required to Download Report',
    },
  }),
  messageValues: { reportName },
})

const ReportIndex = () => {
  const location = useLocation()
  const intl = useIntl()
  const [showProgressBar, setShowProgressBar] = useState(false)
  const filter = useFilterValues(location.pathname)
  const idleTimer = useIdleTimerContext()

  useEffect(() => {
    return () => {
      idleTimer.resume()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: reportListResponse, isLoading } = useQuery([REPORT_LIST.KEY, { params: filter }], async () =>
    fetchWrapperForQueries({ endpoint: REPORT_LIST.ENDPOINT, params: filter })
  )

  const { mutate: onClickSubmitAsyncReportRequest, isSubmitting: isSubmittingReportRequest } = useMutation(
    async ({ report, fileExtension }) => {
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
      return fetchWrapperForQueries({
        endpoint: `${REPORT_LIST.ENDPOINT}/${report.externalId}/async`,
        method: 'POST',
        params: { reportsFilter: filter, format: fileExtension, timeZone },
        customErrorNotifications: getCustomErrorNotifications(fileExtension, report.name),
      })
    },
    {
      onSettled: () => {
        // toast component will come here.
      },
      onSuccess: () => {
        toast.success('Report request submitted successfully and you will be notified once it is ready for download.')
        refetchReportRequest()
        refetchAllReportRequests()
      },
      onError: () => {
        toast.error('Report request failed. Please try again later.')
      },
      onMutate: ({ report }) => {
        if (report.validations.includes('dateRangeRequired') && (!filter.minDate || !filter.maxDate)) {
          const store = require('../../store/store').default
          store.dispatch(showError(getDateRangeValidationError(report.name)))
          throw new Error('Date range required')
        }
      },
    }
  )

  const onClickReportSubmit = async ({ report, fileExtension, requestType }) => {
    if (requestType === 'generate') {
      onClickSubmitAsyncReportRequest({ report, fileExtension })
    } else if (requestType === 'download') {
      // Report download mutation comes here
    }
  }

  const {
    data: reportRequestResponse,
    isLoading: reportRequestLoading,
    refetch: refetchReportRequest,
  } = useQuery(
    [`${REPORT_LIST.KEY}/async`, { params: filter }],
    async () =>
      fetchWrapperForQueries({
        method: 'POST',
        endpoint: `${REPORT_LIST.ENDPOINT}/async`,
        params: { reportsFilter: filter },
      }),
    {
      enabled: asyncReportsFeatureEnabled,
    }
  )

  const {
    data: allReportRequestsResponse,
    isLoading: allReportRequestsLoading,
    refetch: refetchAllReportRequests,
  } = useQuery(
    [`${REPORT_LIST.KEY}/async`, 'all-reports'], // unique key to ensure react-query play well with caching for this API.
    async () =>
      fetchWrapperForQueries({
        method: 'GET',
        endpoint: `${REPORT_LIST.ENDPOINT}/async`,
        params: { sortCol: 'createdOn', sortDir: 'desc' },
      }),
    {
      enabled: asyncReportsFeatureEnabled,
    }
  )

  const groupedAllReportRequestsResponse = groupBy(allReportRequestsResponse?.data ?? [], 'externalId')

  const groupedResponse = groupBy(reportRequestResponse?.data ?? [], 'externalId')

  const onClickDownload = (report, fileExtension = 'xlsx') => {
    if (report.validations.includes('dateRangeRequired') && (!filter.minDate || !filter.maxDate)) {
      const store = require('../../store/store').default
      store.dispatch(showError(getDateRangeValidationError(report.name)))
      return
    }

    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    setShowProgressBar(true)
    idleTimer.pause()
    return fetchWrapperForQueries({
      endpoint: `${REPORT_LIST.ENDPOINT}/${report.externalId}`,
      params: { ...filter, format: fileExtension, timeZone, maxDate: filter.maxDate || new Date() },
      customErrorNotifications: getCustomErrorNotifications(fileExtension, report.name),
    })
      .then(async resp => {
        const file = await resp.blob
        safeDownloadFile(file, resp.fileName)
      })
      .finally(() => {
        setShowProgressBar(false)
        idleTimer.resume()
      })
  }

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.reportsTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.reportsTitle)} />
        <ReportsFilter />
        {asyncReportsFeatureEnabled ? (
          <Alert severity="info" sx={{ marginY: 2 }}>
            You can download your report if it’s already generated. If it’s not yet available, you can continue browsing
            the application without interruption. We will notify you once the report is ready for download. <br />
            Below are the details of different statuses and it's meaning:
            <List>
              <ListItem>
                <FaDownload />
                Download: Your report is ready to download
              </ListItem>
              <ListItem>
                <FaHourglassStart />
                Processing: Your report is processing stage and it will be ready in anytime soon
              </ListItem>
              <ListItem>
                <FiRefreshCw />
                Generate: You can generate your report and we will notify once it's ready
              </ListItem>
            </List>
          </Alert>
        ) : null}
        {isLoading || showProgressBar ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={16} sx={{ width: 'auto', margin: 0 }}>
            {reportListResponse.data.map(report => (
              <ReportCard
                key={report.externalId}
                title={report.name}
                description={report.description}
                i18nKey={report.i18nKey}
                i18nKeyDescription={report.i18nKeyDescription}
                onClick={() =>
                  asyncReportsFeatureEnabled
                    ? onClickReportSubmit({ report, fileExtension: 'xlsx' })
                    : onClickDownload(report, 'xlsx')
                }
              >
                {asyncReportsFeatureEnabled ? (
                  <Box sx={{ width: '100%' }}>
                    <ReportActions
                      onClickReportSubmit={onClickReportSubmit}
                      report={report}
                      reportRequests={{
                        data: groupedResponse[report.externalId],
                        isLoading: reportRequestLoading,
                        isSubmitting: isSubmittingReportRequest,
                      }}
                    />
                    <ReportRecentRequests
                      reportRequests={groupedAllReportRequestsResponse[report.externalId]}
                      isLoading={allReportRequestsLoading}
                      reportId={report.externalId}
                      report={report}
                    />
                  </Box>
                ) : (
                  <>
                    {report.exportExcel === 1 && (
                      <Button size="small" color="primary" onClick={() => onClickDownload(report, 'xlsx')}>
                        Excel
                      </Button>
                    )}
                    {report.exportCsv === 1 && (
                      <Button size="small" color="primary" onClick={() => onClickDownload(report, 'csv')}>
                        CSV
                      </Button>
                    )}
                  </>
                )}
              </ReportCard>
            ))}
          </Grid>
        )}
      </div>
    </>
  )
}
export default ReportIndex

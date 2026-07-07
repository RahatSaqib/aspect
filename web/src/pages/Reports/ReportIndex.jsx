import React, { useContext, useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, LinearProgress, List, ListItem, TextField } from '@mui/material'
import groupBy from 'lodash/groupBy'
import pick from 'lodash/pick'
import { Helmet } from 'react-helmet'
import { FaDownload, FaHourglassStart } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'
import { useIdleTimerContext } from 'react-idle-timer'
import { defineMessages, useIntl } from 'react-intl'
import { useQuery, useMutation } from 'react-query'
import { toast } from 'react-toastify'
import { DetailHeader } from '../../components'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { REPORT_LIST } from '../../components/QueryFetch/Report/index'
import { getReportParameters, resolveParameterDefaults } from '../../components/ReportParameterForm'
import useAuthState from '../../hooks/useAuthState'
import messages from '../../messages/report'
import FilterContext from '../../providers/FilterProvider/FilterProvider.Context'
import { showError } from '../../store/AppNotificationRedux'
import { safeDownloadFile } from '../../utils/utils/files'
import { asyncReportsFeatureEnabled } from './constants'
import pageMessages from './messages'
import { ReportActions } from './ReportActions'
import ReportCard from './ReportCard'
import ReportFilterDialog from './ReportFilterDialog'
import { ReportRecentRequests } from './ReportRecentRequests'
import styles from './styles.module.css'

const LAST_SUBMISSION_KEY = '/reports/_lastSubmission'
const SHARED_PARAMETER_TYPES = ['state', 'lga', 'site', 'assay', 'consumable', 'dateRange']

// dateRange is virtual: it reads/writes the minDate/maxDate wire keys
const wireKeysOf = parameters =>
  parameters.reduce((keys, p) => (p.type === 'dateRange' ? [...keys, 'minDate', 'maxDate'] : [...keys, p.name]), [])

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
  const intl = useIntl()
  const user = useAuthState()
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogState, setDialogState] = useState(null)
  const [filterState, setFilterState] = useContext(FilterContext)
  const idleTimer = useIdleTimerContext()

  useEffect(() => {
    return () => {
      idleTimer.resume()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: reportListResponse, isLoading } = useQuery([REPORT_LIST.KEY], async () =>
    fetchWrapperForQueries({ endpoint: REPORT_LIST.ENDPOINT, params: {} })
  )

  // Prefill precedence (later spreads win): definition defaults <- shared-type wire
  // keys from the last submission (any report) <- last-used values for THIS report.
  const buildInitialValues = report => {
    const parameters = getReportParameters(report)
    const sharedKeys = wireKeysOf(parameters.filter(p => SHARED_PARAMETER_TYPES.includes(p.type)))
    return {
      ...resolveParameterDefaults(parameters),
      ...pick(filterState[LAST_SUBMISSION_KEY] || {}, sharedKeys),
      ...(filterState[`/reports/${report.externalId}`] || {}),
    }
  }

  const openDialog = ({ report, fileExtension, requestType }) =>
    setDialogState({ report, fileExtension, requestType, initialValues: buildInitialValues(report) })

  const persistValues = (report, values) => {
    setFilterState(prev => ({
      ...prev,
      [`/reports/${report.externalId}`]: values,
      [LAST_SUBMISSION_KEY]: values,
    }))
  }

  const { mutate: onClickSubmitAsyncReportRequest, isSubmitting: isSubmittingReportRequest } = useMutation(
    async ({ report, fileExtension, values }) => {
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
      return fetchWrapperForQueries({
        endpoint: `${REPORT_LIST.ENDPOINT}/${report.externalId}/async`,
        method: 'POST',
        params: { reportsFilter: { ...values, countryId: user.countryId }, format: fileExtension, timeZone },
        customErrorNotifications: getCustomErrorNotifications(fileExtension, report.name),
      })
    },
    {
      onSettled: () => {
        // toast component will come here.
      },
      onSuccess: (data, { report, values }) => {
        persistValues(report, values)
        toast.success('Report request submitted successfully and you will be notified once it is ready for download.')
        refetchReportRequest()
        refetchAllReportRequests()
      },
      onError: () => {
        toast.error('Report request failed. Please try again later.')
      },
      onMutate: ({ report, values }) => {
        if (report.validations.includes('dateRangeRequired') && (!values.minDate || !values.maxDate)) {
          const store = require('../../store/store').default
          store.dispatch(showError(getDateRangeValidationError(report.name)))
          throw new Error('Date range required')
        }
      },
    }
  )

  const onClickReportSubmit = async ({ report, fileExtension, requestType }) => {
    if (requestType === 'generate') {
      openDialog({ report, fileExtension, requestType })
    } else if (requestType === 'download') {
      // Report download mutation comes here
    }
  }

  const {
    data: reportRequestResponse,
    isLoading: reportRequestLoading,
    refetch: refetchReportRequest,
  } = useQuery(
    [`${REPORT_LIST.KEY}/async`],
    async () =>
      fetchWrapperForQueries({
        method: 'POST',
        endpoint: `${REPORT_LIST.ENDPOINT}/async`,
        params: {},
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

  const onClickDownload = (report, fileExtension = 'xlsx', values = {}) => {
    if (report.validations.includes('dateRangeRequired') && (!values.minDate || !values.maxDate)) {
      const store = require('../../store/store').default
      store.dispatch(showError(getDateRangeValidationError(report.name)))
      return
    }

    persistValues(report, values)

    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    setShowProgressBar(true)
    idleTimer.pause()
    return fetchWrapperForQueries({
      endpoint: `${REPORT_LIST.ENDPOINT}/${report.externalId}`,
      params: {
        ...values,
        countryId: user.countryId,
        format: fileExtension,
        timeZone,
        maxDate: values.maxDate || new Date(),
      },
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

  const onDialogSubmit = values => {
    const { report, fileExtension } = dialogState
    if (asyncReportsFeatureEnabled) {
      onClickSubmitAsyncReportRequest({ report, fileExtension, values })
    } else {
      onClickDownload(report, fileExtension, values)
    }
    setDialogState(null)
  }

  // Same localized resolution as ReportCard.jsx
  const localizeReport = report => ({
    name: messages[report.i18nKey] ? intl.formatMessage(messages[report.i18nKey]) : report.name,
    description: messages[report.i18nKeyDescription]
      ? intl.formatMessage(messages[report.i18nKeyDescription])
      : report.description,
  })

  const searchTerm = search.trim().toLowerCase()
  const visibleReports = (reportListResponse?.data ?? []).filter(report => {
    if (!searchTerm) return true
    const { name, description } = localizeReport(report)
    return (name || '').toLowerCase().includes(searchTerm) || (description || '').toLowerCase().includes(searchTerm)
  })

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.reportsTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.reportsTitle)} />
        <TextField
          fullWidth
          size="small"
          label={intl.formatMessage(pageMessages.searchReports)}
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ marginY: 2 }}
        />
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
            {visibleReports.map(report => (
              <ReportCard
                key={report.externalId}
                title={report.name}
                description={report.description}
                i18nKey={report.i18nKey}
                i18nKeyDescription={report.i18nKeyDescription}
                onClick={() =>
                  asyncReportsFeatureEnabled
                    ? onClickReportSubmit({ report, fileExtension: 'xlsx' })
                    : openDialog({ report, fileExtension: 'xlsx' })
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
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => openDialog({ report, fileExtension: 'xlsx' })}
                      >
                        Excel
                      </Button>
                    )}
                    {report.exportCsv === 1 && (
                      <Button size="small" color="primary" onClick={() => openDialog({ report, fileExtension: 'csv' })}>
                        CSV
                      </Button>
                    )}
                  </>
                )}
              </ReportCard>
            ))}
          </Grid>
        )}
        <ReportFilterDialog
          open={Boolean(dialogState)}
          report={dialogState?.report}
          fileExtension={dialogState?.fileExtension}
          requestType={dialogState?.requestType}
          initialValues={dialogState?.initialValues}
          onClose={() => setDialogState(null)}
          onSubmit={onDialogSubmit}
        />
      </div>
    </>
  )
}
export default ReportIndex

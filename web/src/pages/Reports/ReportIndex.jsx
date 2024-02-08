import React, { useState } from 'react'
import { Button, Grid, LinearProgress } from '@mui/material'
import { Helmet } from 'react-helmet'
import { defineMessages, useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { DetailHeader, ReportsFilter } from '../../cleanComponents'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { REPORT_LIST } from '../../components/QueryFetch/Report/index'
import useFilterValues from '../../hooks/useFilterValues'
import messages from '../../messages/report'
import { safeDownloadFile } from '../../utils/utils/files'
import ReportCard from './ReportCard'
import styles from './styles.module.css'

const getCustomErrorNotifications = (fileExtension, reportName) => ({
  default: error => ({
    severity: 'error',
    ...defineMessages({
      resolution: {
        id: 'errorResponseMessages.reportStream.tryAgainLater.resolution',
        defaultMessage: `Failed to generate {fileType} report "{reportName}" because of error "{errorMessage}".
          Please, try again in a few minutes. If the error persists, contact your administrator for support.`,
      },
      title: {
        id: 'queryFetch.errorResponseMessages.GET.default.title',
        defaultMessage: 'Error Fetching Endpoint',
      },
    }),
    messageValues: {
      reportName,
      errorMessage: error.message,
      fileType: fileExtension === 'xlsx' ? 'Excel' : fileExtension,
    },
  }),
})

const ReportIndex = () => {
  const location = useLocation()
  const intl = useIntl()
  const [showProgressBar, setShowProgressBar] = useState(false)
  const filter = useFilterValues(location.pathname)

  const { data: reportListResponse, isLoading } = useQuery([REPORT_LIST.KEY, { params: filter }], async () =>
    fetchWrapperForQueries({ endpoint: REPORT_LIST.ENDPOINT, params: filter })
  )

  const onClickDownload = (externalId, reportName, fileExtension = 'xlsx') => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    setShowProgressBar(true)
    return fetchWrapperForQueries({
      endpoint: `${REPORT_LIST.ENDPOINT}/${externalId}`,
      params: { ...filter, format: fileExtension, timeZone, maxDate: filter.maxDate || new Date() },
      customErrorNotifications: getCustomErrorNotifications(fileExtension, reportName),
    })
      .then(async resp => {
        const file = await resp.blob
        safeDownloadFile(file, resp.fileName)
      })
      .finally(() => {
        setShowProgressBar(false)
      })
  }

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.reportsTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.reportsTitle)} />
        <ReportsFilter />
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
                onClick={() => onClickDownload(report.externalId, report.name, 'xlsx')}
              >
                {report.exportExcel === 1 && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => onClickDownload(report.externalId, report.name, 'xlsx')}
                  >
                    Excel
                  </Button>
                )}
                {report.exportCsv === 1 && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => onClickDownload(report.externalId, report.name, 'csv')}
                  >
                    CSV
                  </Button>
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

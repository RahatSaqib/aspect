import React, { Fragment, useMemo, useState } from 'react'
import { Card, CardContent, CircularProgress, Table, TableBody, TableCell, TableRow } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { DetailHeader, NotificationLogFilter, SimpleTableHeader, SimpleTablePagination } from '../../../cleanComponents'
import { allowOnlyAPIKeys, removeNullFromCollection, timeAndDate } from '../../../components/AspectTable/Helpers'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { replaceRouteParams } from '../../../components/QueryFetch/Helpers'
import { NOTIFICATION_LOG_ENDPOINT, NOTIFICATION_LOG_KEY } from '../../../hooks/notification/notificationKeys'
import useI18n from '../../../hooks/useI18n'
import { useFilterValues } from '../../../providers/FilterProvider'
import { EmailCell, SMSCell, WebhookCell } from '../NotificationHistoryPage/ErrorCell/NotificationCells'
import { DataCell } from './DataCell'
import messages from './messages'
import styles from './NotificationLogsPage.css'

const cssClasses = classnames.bind(styles)

const NotificationHistoryPage = () => {
  const intl = useI18n()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)
  const [sortCol, setSortCol] = useState('date')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const params = useMemo(() => {
    const { notificationCategoryTypeId, onlyErrors, reportWithName, ...rest } = filters
    return removeNullFromCollection({
      size,
      sortCol,
      sortDir,
      page,
      reportName: reportWithName,
      notificationTypeCategoryId: notificationCategoryTypeId,
      notificationWithErrors: onlyErrors,
      ...rest,
    })
  }, [page, size, sortCol, sortDir, filters])

  const { isLoading, data = false } = useQuery(
    [NOTIFICATION_LOG_KEY, { params }],
    async ({ queryKey: [, { params }] }) => {
      return fetchWrapperForQueries({
        endpoint: replaceRouteParams(NOTIFICATION_LOG_ENDPOINT),
        params: allowOnlyAPIKeys(params),
      })
    },
    { keepPreviousData: true }
  )

  const columns = [
    {
      id: 'date',
      label: intl.formatMessage(messages.createdOn),
      width: 10,
    },
    {
      id: 'notificationName',
      label: intl.formatMessage(messages.notificationsTableHeaderCategory),
      width: 10,
    },
    {
      id: 'notificationTypeName',
      label: intl.formatMessage(messages.notificationsTableHeaderType),
      width: 10,
    },
    {
      id: 'data',
      label: intl.formatMessage(messages.notificationsTableHeaderData),
      width: 10,
    },
    {
      id: 'emailRecipients',
      label: intl.formatMessage(messages.eventsTableHeaderEmailSent),
      width: 5,
    },
    {
      id: 'smsRecipients',
      label: intl.formatMessage(messages.eventsTableSmsSent),
      width: 5,
    },
    {
      id: 'webhookSent',
      label: intl.formatMessage(messages.eventsTableWebhookSent),
      width: 5,
    },
  ]

  return (
    <Fragment>
      <DetailHeader name={intl.formatMessage(messages.notificationLogs)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.notificationLogs)} />
        <NotificationLogFilter />
        <Card>
          <CardContent>
            {isLoading ? (
              <div className={cssClasses('table__spinner')}>
                <CircularProgress />
              </div>
            ) : (
              <>
                <Table size="small">
                  <SimpleTableHeader
                    columns={columns}
                    sortCol={sortCol}
                    setSortCol={setSortCol}
                    sortDir={sortDir}
                    setSortDir={setSortDir}
                  />
                  <TableBody>
                    {(data?.data || []).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{timeAndDate(row.date, 'yyyy-MM-dd hh:mm:ss')}</TableCell>
                        <TableCell>{row.notificationTypeName}</TableCell>
                        <TableCell>{row.notificationName}</TableCell>
                        <TableCell>
                          <DataCell {...row.data} resultId={row.resultId} />
                        </TableCell>
                        <TableCell>
                          <EmailCell item={row} value={row.emailRecipients} />
                        </TableCell>
                        <TableCell>
                          <SMSCell item={row} value={row.smsRecipients} />
                        </TableCell>
                        <TableCell>
                          <WebhookCell item={row} value={row.webhookRecipients} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <SimpleTablePagination
                  paginatorStatus={messages.paginatorStatus}
                  onPageSizeChange={setSize}
                  onPageChange={setPage}
                  pageAt={page}
                  pageSize={size}
                  total={data.total}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Fragment>
  )
}

export default NotificationHistoryPage

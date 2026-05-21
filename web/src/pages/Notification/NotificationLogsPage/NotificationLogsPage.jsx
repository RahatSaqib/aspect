import React, { Fragment, useMemo, useState } from 'react'
import { Close, MoreHoriz, Done } from '@mui/icons-material'
import { Card, CardContent, CircularProgress, Table, TableBody, TableCell, TableRow, Tooltip } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { DetailHeader, NotificationLogFilter, SimpleTableHeader, SimpleTablePagination } from '../../../components'
import { allowOnlyAPIKeys, removeNullFromCollection, timeAndDate } from '../../../components/AspectTable/Helpers'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { replaceRouteParams } from '../../../components/QueryFetch/Helpers'
import { NOTIFICATION_LOG_ENDPOINT, NOTIFICATION_LOG_KEY } from '../../../hooks/notification/notificationKeys'
import useFilterValues from '../../../hooks/useFilterValues'
import { DataCell } from './DataCell'
import messages from './messages'
import styles from './NotificationLogsPage.module.css'

const cssClasses = classnames.bind(styles)

const statusIcons = {
  Error: <Close style={{ color: 'red' }} />,
  Sent: <Done style={{ color: 'green' }} />,
  Pending: <MoreHoriz style={{ color: '#0095ff' }} />,
}

const NotificationHistoryPage = () => {
  const intl = useIntl()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)
  const [sortCol, setSortCol] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const params = useMemo(() => {
    const { notificationCategoryTypeId, notificationCategory, onlyErrors, reportWithName, ...rest } = filters
    const [category, type] = notificationCategory?.split('=') ?? ''
    return removeNullFromCollection({
      size,
      sortCol,
      sortDir,
      page,
      reportName: reportWithName,
      notificationTypeCategoryId: notificationCategoryTypeId,
      notificationWithErrors: onlyErrors,
      ...(type === 'category' ? { notificationTypeName: category } : { issueTypeName: category }),
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
      id: 'recepientName',
      label: intl.formatMessage(messages.notificationsTableRecepientName),
      width: 10,
    },
    {
      id: 'webhookRecepient',
      label: intl.formatMessage(messages.notificationsTableWebhookRecepient),
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

  const getIcon = status => {
    const icon = statusIcons[status]
    if (icon) {
      return (
        <Tooltip title={status} disableInteractive>
          {icon}
        </Tooltip>
      )
    }
    return '-'
  }

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
                        <TableCell>{row.recepientName}</TableCell>
                        <TableCell>{row.webhookRecipient}</TableCell>
                        <TableCell>{getIcon(row.emailStatus)}</TableCell>
                        <TableCell>{getIcon(row.smsStatus)}</TableCell>
                        <TableCell>{getIcon(row.webHookStatus)}</TableCell>
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

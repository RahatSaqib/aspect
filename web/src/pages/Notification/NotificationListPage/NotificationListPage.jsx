import React, { useState, useMemo } from 'react'
import { Card, CardContent, CircularProgress, Table, TableBody, TableRow, TableCell } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { DetailHeader, NotificationFilter, SimpleTableHeader, SimpleTablePagination } from '../../../components'
import { allowOnlyAPIKeys, removeNullFromCollection } from '../../../components/AspectTable/Helpers'
import ContactsCell from '../../../components/AspectTable/TableCell/ContactsCell'
import { DateTimeCellFlagged } from '../../../components/AspectTable/TableCell/DateTimeCell'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { replaceRouteParams } from '../../../components/QueryFetch/Helpers'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import useFilterValues from '../../../hooks/useFilterValues'
import AspectButton from '../../../components/shared/AspectButton'
import messages from './messages'
import styles from './NotificationListPage.module.css'
import NotificationsContextualMenu from './NotificationsContextualMenu'

const NotificationList = () => {
  const intl = useIntl()
  const { formatMessage } = intl
  const navigate = useNavigate()
  const { ...routeParams } = useParams()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)

  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const params = useMemo(
    () => removeNullFromCollection({ size, sortCol, sortDir, page, ...filters }),
    [page, size, sortCol, sortDir, filters]
  )

  const {
    error,
    isError,
    isLoading,
    data = false,
  } = useQuery(
    [NOTIFICATION_LIST.KEY, { params }],
    async ({ queryKey: [, { params }] }) => {
      return fetchWrapperForQueries({
        endpoint: replaceRouteParams(NOTIFICATION_LIST.ENDPOINT, routeParams),
        params: allowOnlyAPIKeys(params),
      })
    },
    { keepPreviousData: true }
  )

  if (isError) {
    throw new Error(error)
  }

  const columns = [
    {
      id: 'name',
      label: formatMessage(messages.notificationsTableHeaderName),
      width: 30,
    },
    {
      id: 'typeCategory',
      label: formatMessage(messages.notificationsTableHeaderCategory),
      width: 15,
    },
    {
      id: 'lastTriggeredOn',
      label: formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 10,
    },
    {
      id: 'totalTriggers',
      label: formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 5,
    },
    {
      id: 'jobFunctions',
      label: formatMessage(messages.notificationsTableHeaderJobFunctions),
      width: 25,
    },
    {
      id: 'persons',
      label: formatMessage(messages.notificationsTableHeaderJobFunctionsPersons),
      width: 25,
    },
    {
      key: 'sendToPatient',
      label: formatMessage(messages.sendToPatient),
      width: 5,
    },
    {
      key: 'enabled',
      label: formatMessage(messages.status),
      width: 5,
    },
    {
      key: 'actions',
      label: '',
    },
  ]

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.notificationsTitle)} disableBack>
        <AspectButton variant="contained" browseButton onClick={() => navigate('/browse/notification/create')}>
          {intl.formatMessage(messages.createNotification)}
        </AspectButton>
      </DetailHeader>
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
        <NotificationFilter />
        <Card>
          <CardContent>
            {isLoading ? (
              <div className={styles.table__spinner}>
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
                    {(data.data || []).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{formatMessage(messages[row.typeCategory])}</TableCell>
                        <TableCell>
                          <DateTimeCellFlagged value={row.lastTriggeredOn} />
                        </TableCell>
                        <TableCell>{row.totalTriggers}</TableCell>
                        <TableCell>
                          <ContactsCell value={row.jobFunctions} />
                        </TableCell>
                        <TableCell>
                          <ContactsCell value={row.persons} />
                        </TableCell>
                        <TableCell>
                          {formatMessage(
                            messages[row.sendToPatient === true || row.sendToPatient === 'true' ? 'yes' : 'no']
                          )}
                        </TableCell>
                        <TableCell>
                          <input type="checkbox" checked={row.enabled} disabled />
                        </TableCell>
                        <TableCell>
                          <NotificationsContextualMenu item={row} />
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
    </>
  )
}

export default NotificationList

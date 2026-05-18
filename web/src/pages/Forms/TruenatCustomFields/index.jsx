import React from 'react'
import { Chip, LinearProgress, Link, Table, TableBody, TableRow } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { DetailHeader, TruenatCustomFieldsFilter } from '../../../components'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { FORM_DATA_LIST } from '../../../components/QueryFetch/FormData'
import { usePathFilter } from '../../../hooks/usePathFilter'
import allMessages from '../../../messages/allMessages'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import DataTableCard from '../../../components/shared/DataTableCard'
import { DataTableCell } from '../../../components/shared/tableBody'
import DataTableHead from '../../../components/shared/tableHead'
import { routePaths } from '../../../routes/constants'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { formatDate } from '../../../utils/utils/dateFormat'
import messages from './messages'
import styles from './TruenatCustomFields.module.css'

const TruenatCustomFieldsList = () => {
  const { formatMessage } = useIntl()
  const location = useLocation()
  const navigate = useNavigate()
  const [filters] = usePathFilter()

  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'createdOn', sortDir: 'desc' })({
    location,
  })

  /**
   * Send nominal calendar days at fixed UTC wall times (same pattern as result list query strings):
   * yyyy-MM-dd from the user's profile timezone, then T00:00:00.000Z / T23:59:59.999Z so the backend can apply
   * IANA conversion without local-midnight drift from `Date#toISOString()`.
   */
  // const dateFrom =
  //   filters.minDate != null
  //     ? `${formatInTimeZone(filters.minDate, userTimeZone, 'yyyy-MM-dd')}T00:00:00.000Z`
  //     : undefined
  // const dateTo =
  //   filters.maxDate != null
  //     ? `${formatInTimeZone(filters.maxDate, userTimeZone, 'yyyy-MM-dd')}T23:59:59.999Z`
  //     : undefined

  const params = omitBy(
    {
      siteId: filters.siteId,
      sampleExternalId: filters.sampleExternalId,
      matched: filters.matched,
      minDate: filters.minDate,
      maxDate: filters.maxDate,
    },
    isNil
  )

  const { data, isLoading } = useQuery([FORM_DATA_LIST.KEY, params], () =>
    fetchWrapperForQueries({ endpoint: FORM_DATA_LIST.ENDPOINT, params })
  )

  const rows = data?.data || []

  const columns = [
    { key: 'sampleExternalId', label: formatMessage(messages.sampleId), sortable: false },
    { key: 'siteName', label: formatMessage(messages.siteName), sortable: false },
    { key: 'collectedOn', label: formatMessage(messages.dateOfTest), sortable: false },
    { key: 'resultId', label: formatMessage(messages.matchToResult), sortable: false },
    { key: 'resultEndedOn', label: formatMessage(messages.resultEndedOn), sortable: false },
    { key: 'createdOn', label: formatMessage(messages.dateUploaded), sortable: false },
  ]

  return (
    <>
      <DetailHeader name={formatMessage(messages.title)} disableBack />
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <TruenatCustomFieldsFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`}>
          {isLoading ? (
            <LinearProgress />
          ) : rows.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <Table className={styles.DataTable}>
                <DataTableHead
                  navigate={navigate}
                  location={location}
                  sortColumnKey={sortCol}
                  sortColumnDir={sortDir}
                  columns={columns}
                />
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id} hover>
                      <DataTableCell>
                        <Link
                          component={RouterLink}
                          to={routePaths.FORMS_TRUENAT_CUSTOM_FIELDS_DETAIL.replace(':id', row.id)}
                        >
                          {row.sampleExternalId || '-'}
                        </Link>
                      </DataTableCell>
                      <DataTableCell>{row.siteName}</DataTableCell>
                      <DataTableCell>{formatDate(row.collectedOn)}</DataTableCell>
                      <DataTableCell>
                        {row.resultId ? (
                          <Link component={RouterLink} to={`/browse/result/${row.resultId}`}>
                            {formatMessage(allMessages.matched)}
                          </Link>
                        ) : (
                          <Chip label={formatMessage(allMessages.noMatch)} color="error" size="small" />
                        )}
                      </DataTableCell>
                      <DataTableCell>{row.resultEndedOn ? formatDate(row.resultEndedOn) : '-'}</DataTableCell>
                      <DataTableCell>{formatDate(row.createdOn)}</DataTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                paginatorStatus={messages.paginatorStatus}
                total={data?.total}
                pageAt={pageAt}
                pageSize={pageSize}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default TruenatCustomFieldsList

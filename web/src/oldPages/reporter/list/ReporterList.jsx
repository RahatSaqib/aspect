import React, { useState, useEffect } from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { DetailHeader, ReporterFilter } from '../../../cleanComponents'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useFilterValues from '../../../hooks/useFilterValues'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { REPORTERS_LIST } from '../ReporterQueries'
import messages from './messages'
import { ReporterDataTable, ReporterDataTableHead, ReporterDataTableRow } from './ReporterDataTable'
import styles from './ReporterList.module.css'

// }

const getCurrentPagination = location => {
  const sortPage = makeSortPageSelector({ sortCol: 'siteName', sortDir: 'asc' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  return { sortCol, sortDir, page: pageAt, size: pageSize }
}

const ReporterList = () => {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)

  const [pagination, setPagination] = useState(getCurrentPagination(location))

  const { sortCol, sortDir, page: pageAt, size: pageSize } = pagination
  const params = { ...pagination, ...filters }

  const { isLoading, isError, data, error } = useQuery(
    [REPORTERS_LIST.KEY, { params }],
    async () => fetchWrapperForQueries({ endpoint: REPORTERS_LIST.ENDPOINT, params }),
    { enabled: !isEmpty(params) }
  )

  useEffect(() => {
    setPagination(getCurrentPagination(location))
  }, [location])

  if (isError) throw new Error(error)

  return (
    <>
      <DetailHeader name={formatMessage(messages.reportersTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.reportersTitle)} />
        <ReporterFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`}>
          {isLoading ? (
            <LinearProgress />
          ) : data?.data.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <ReporterDataTable className={styles.ReporterDataTable}>
                <ReporterDataTableHead
                  navigate={navigate}
                  location={location}
                  sortColumnKey={sortCol}
                  sortColumnDir={sortDir}
                  columns={[
                    { key: 'siteName', label: formatMessage(messages.siteName), sortable: true },
                    { key: 'samplesRegistered', label: formatMessage(messages.samplesRegistered), sortable: true },
                    { key: 'resultsReporting', label: formatMessage(messages.resultsReporting), sortable: true },
                    { key: 'downloaded', label: formatMessage(messages.downloaded), sortable: true },
                    { key: 'followUpRequired', label: formatMessage(messages.followUpRequired), sortable: true },
                    { key: 'followUpPending', label: formatMessage(messages.followUpPending), sortable: true },
                    { key: 'followUpConfirmed', label: formatMessage(messages.followUpConfirmed), sortable: true },
                    { key: 'followUpNotPossible', label: formatMessage(messages.followUpNotPossible), sortable: true },
                  ]}
                />
                <TableBody>
                  {data?.data.map(reporter => (
                    <ReporterDataTableRow key={reporter.siteId} reporter={reporter} />
                  ))}
                </TableBody>
              </ReporterDataTable>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                className={styles.BrowseTablePaginator}
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

export default ReporterList

import React from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import { DetailHeader, ReporterFilter } from '../../../cleanComponents'
import useReportingSite from '../../../hooks/site/useReportingSite.jsx'
import useFilterValues from '../../../hooks/useFilterValues'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../oldComponents/shared/tableBody'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import { ReporterDataTable, ReporterDataTableHead } from './ReporterDataTable'
import styles from './ReporterList.module.css'

const ReporterList = () => {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)

  const sortPage = makeSortPageSelector({ sortCol: 'siteName', sortDir: 'asc' })
  const { sortCol, sortDir, pageAt: page, pageSize: size } = sortPage({ location })

  const { isLoading, isError, data, error } = useReportingSite({ sortCol, sortDir, page, size, ...filters })

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
          ) : data.data.length === 0 ? (
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
                  {data.data.map(reporter => (
                    <TableRow key={reporter.siteId}>
                      <TableCell>{reporter.siteName}</TableCell>
                      <TableCell>{reporter.samplesRegistered}</TableCell>
                      <TableCell>{reporter.resultsReporting}</TableCell>
                      <TableCell>{reporter.resultsDownloaded}</TableCell>
                      <TableCell>{reporter.requiresFollowUp}</TableCell>
                      <TableCell>{reporter.followUpPending}</TableCell>
                      <TableCell>{reporter.followUpConfirmed}</TableCell>
                      <TableCell>{reporter.followUpNotPossible}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ReporterDataTable>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                className={styles.BrowseTablePaginator}
                paginatorStatus={messages.paginatorStatus}
                total={data?.total}
                pageAt={page}
                pageSize={size}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default ReporterList

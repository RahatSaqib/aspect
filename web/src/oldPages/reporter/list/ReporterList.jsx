import React, { useCallback } from 'react'
import { Button, LinearProgress, TableBody } from '@mui/material'
import find from 'lodash/find'
import merge from 'lodash/merge'
import pick from 'lodash/pick'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import { DetailHeader, ReporterFilter } from '../../../cleanComponents'
import useTreatmentStatus from '../../../hooks/result/useTreatmentStatus'
import useReportingSite from '../../../hooks/site/useReportingSite.jsx'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
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
  const [addFilter] = useFilterUpdate()

  const sortPage = makeSortPageSelector({ sortCol: 'siteName', sortDir: 'asc' })
  const { sortCol, sortDir, pageAt: page, pageSize: size } = sortPage({ location })

  const { isLoading, isError, data, error } = useReportingSite({ sortCol, sortDir, page, size, ...filters })

  const { data: treatmentStatuses } = useTreatmentStatus()

  const handleColumnClick = useCallback(
    (siteName, column) => {
      const findTreatmentStatus = id => find(treatmentStatuses, { externalId: id })?.externalId
      const destination = '/browse/result'
      const params = {
        onlyReportableResults: true,
        reportableSiteName: siteName,
        ...pick(filters, ['minDate', 'maxDate']),
      }
      switch (column) {
        case 'resultsDownloaded':
          merge(params, { onlyDownloadedByReporter: true })
          break
        case 'requiresFollowUp':
          merge(params, { onlyTreatmentRequired: true })
          break
        case 'followUpPending':
          merge(params, {
            treatmentStatus: findTreatmentStatus('AwaitingTreatment'),
            onlyTreatmentRequired: true,
          })
          break
        case 'followUpConfirmed':
          merge(params, {
            treatmentStatus: findTreatmentStatus('OnTreatment'),
            onlyTreatmentRequired: true,
          })
          break
        case 'followUpNotPossible':
          merge(params, {
            treatmentStatus: findTreatmentStatus('NotPossible'),
            onlyTreatmentRequired: true,
          })
          break
        default:
          break
      }
      addFilter(params, destination)
      navigate(destination)
    },
    [filters, addFilter, navigate, treatmentStatuses]
  )

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
                    { key: 'requiresFollowUp', label: formatMessage(messages.followUpRequired), sortable: true },
                    { key: 'followUpPending', label: formatMessage(messages.followUpPending), sortable: true },
                    { key: 'followUpConfirmed', label: formatMessage(messages.followUpConfirmed), sortable: true },
                    { key: 'followUpNotPossible', label: formatMessage(messages.followUpNotPossible), sortable: true },
                  ]}
                />
                <TableBody>
                  {data.data.map(reporter => (
                    <TableRow key={reporter.siteId}>
                      <TableCell>{reporter.siteName}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => {
                            addFilter(
                              {
                                siteId: reporter.siteId,
                                ...pick(filters, ['minDate', 'maxDate']),
                              },
                              '/browse/samples'
                            )
                            navigate('/browse/samples')
                          }}
                          variant="text"
                        >
                          {reporter.samplesRegistered}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleColumnClick(reporter.siteName, 'resultsReporting')} variant="text">
                          {reporter.resultsReporting}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleColumnClick(reporter.siteName, 'resultsDownloaded')}
                          variant="text"
                        >
                          {reporter.resultsDownloaded}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleColumnClick(reporter.siteName, 'requiresFollowUp')} variant="text">
                          {reporter.requiresFollowUp}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleColumnClick(reporter.siteName, 'followUpPending')} variant="text">
                          {reporter.followUpPending}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleColumnClick(reporter.siteName, 'followUpConfirmed')}
                          variant="text"
                        >
                          {reporter.followUpConfirmed}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleColumnClick(reporter.siteName, 'followUpNotPossible')}
                          variant="text"
                        >
                          {reporter.followUpNotPossible}
                        </Button>
                      </TableCell>
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

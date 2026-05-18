import React from 'react'
import PermIdentity from '@mui/icons-material/PermIdentity'
import { Card, LinearProgress, Table, TableBody, Tooltip } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import map from 'lodash/map'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useQuery, useMutation } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import BrowseEmptyList from '../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../components/BrowseTablePaginator'
import styles from '../../components/shared/DataTableRow.module.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import DataTableHead from '../../components/shared/tableHead'
import getExportableFile from '../../pages/Result/ResultQueries'
import { gotoWithReturnUrl } from '../../utils/utils/browser'
import AspectExportListButton from '../AspectExportListButton'
import fetchWrapperForQueries from '../QueryFetch'
import { RESULT_LIST, RESULT_LIST_TOTAL } from '../QueryFetch/Result'
import cssStyles from './DeviceResultHistory.module.css'
import messages from './messages'

const getBaseColumns = ({ formatMessage, formatDate }) => {
  return [
    {
      key: 'endedOn',
      label: formatMessage(messages.endedOn),
      formatter: value => formatDate(value),
      sortable: true,
    },
    { key: 'sampleOriginSiteName', label: formatMessage(messages.sampleOriginSiteName), sortable: true },
    { key: 'sampleId', label: formatMessage(messages.sampleId), sortable: true },
    { key: 'errorCode', label: formatMessage(messages.errorCode), sortable: true },
    { key: 'patientId', label: formatMessage(messages.patientId), sortable: true },
    { key: 'resultText', label: formatMessage(messages.resultText), sortable: false, formatter: () => true },
  ]
}

const DeviceResultHistory = ({ deviceId, sortDir, sortCol, pageAt, pageSize }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatDate, formatMessage } = useIntl()
  const page = pageAt
  const size = pageSize
  const filters = { showUnapprovedDevices: true, showDecommissionedDevices: true, deviceId }
  // Params for main list query
  const params = omitBy(omit({ sortCol, sortDir, page, size, ...filters }, ['assayOverride']), isNil)

  const { isLoading, data, isError, error } = useQuery(
    [RESULT_LIST.KEY, { ...params }],
    () => fetchWrapperForQueries({ endpoint: RESULT_LIST.ENDPOINT, params }),
    {
      select: ({ data, hasNextPage }) => {
        return {
          items: data,
          hasNextPage,
        }
      },
    }
  )
  const columns = getBaseColumns({ formatMessage, formatDate })

  // Params for total count - only include filters, exclude page/size/sort
  // Total only changes when filters change, not when paginating or sorting
  const totalParams = omitBy(omit({ ...filters }, ['assayOverride']), isNil)

  // Deferred query for total count - cached until filters change
  const { data: totalData, isLoading: isLoadingTotal } = useQuery(
    [RESULT_LIST_TOTAL.KEY, { ...totalParams }],
    () => fetchWrapperForQueries({ endpoint: RESULT_LIST_TOTAL.ENDPOINT, params: totalParams }),
    {
      enabled: true,
      select: ({ total }) => total,
      staleTime: Infinity, // Never consider this data stale
      cacheTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    }
  )

  const { isLoading: isExporting, mutateAsync: onExportClick } = useMutation(formatType =>
    getExportableFile(filters, formatType, sortCol, sortDir, 'results')
  )

  if (isError) throw new Error(error)

  return (
    <section className={cssStyles.Section}>
      <Card className={cssStyles.Section__Content}>
        <header className={cssStyles.Header}>
          <div className={cssStyles.Header__Title}>{`${formatMessage(messages.testHistory)}`}</div>
          {onExportClick && (
            <div className={cssStyles.Header__Actions}>
              <AspectExportListButton
                onExport={onExportClick}
                visible={!isEmpty(data?.items)}
                reportName="Results"
                disableExcel
              />
            </div>
          )}
        </header>
        <div>
          {isLoading || isExporting ? (
            <LinearProgress />
          ) : isEmpty(data?.items) ? (
            <BrowseEmptyList />
          ) : (
            <>
              <Table className={cssStyles.ResultDataTable}>
                <DataTableHead
                  navigate={navigate}
                  location={location}
                  sortColumnKey={sortCol}
                  sortColumnDir={sortDir}
                  columns={columns.map(column => omit(column, ['formatter']))}
                />
                <TableBody>
                  {data.items.map(result => (
                    <TableRow
                      key={result.id}
                      onClick={e =>
                        gotoWithReturnUrl(
                          `/browse/result/${e.currentTarget.dataset.resultId || 'add'}`,
                          navigate,
                          location
                        )
                      }
                      data-result-id={result.id}
                    >
                      {columns &&
                        map(
                          columns.filter(col => col.key !== 'resultText'),
                          elem => (
                            <TableCell key={`${result.id}-${elem.key}`} hiddenOn={elem.hiddenOn || 'sm'}>
                              {elem.tooltip && result[elem.key] && (
                                <Tooltip title={result[elem.tooltip]} disableInteractive>
                                  <PermIdentity className={styles[`${result[elem.key]}`]} />
                                </Tooltip>
                              )}
                              {!elem.tooltip && (elem.formatter ? elem.formatter(result[elem.key]) : result[elem.key])}
                            </TableCell>
                          )
                        )}

                      <TableCell>
                        {`${formatMessage(
                          messages[result.resultCategory1Titlei18nKey],
                          null,
                          result.resultCategory1Title
                        )}:${formatMessage(messages[result.resultCategory1I18nKey], null, result.resultCategory1Name)}`}
                        {result.resultCategory2I18nKey &&
                          result.resultCategory2Titlei18nKey &&
                          ` | ${formatMessage(
                            messages[result.resultCategory2Titlei18nKey],
                            null,
                            result.resultCategory2Title
                          )}:${formatMessage(
                            messages[result.resultCategory2I18nKey],
                            null,
                            result.resultCategory2Name
                          )}`}
                        {result.resultCategory2I18nKey &&
                          !result.resultCategory2Titlei18nKey &&
                          ` | ${formatMessage(
                            messages[result.resultCategory2I18nKey],
                            null,
                            result.resultCategory2Name
                          )}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                timedMessageUsed={sortCol === 'endedOn'}
                paginatorStatus={messages.paginatorStatus}
                paginatorStatusLoading={messages.paginatorStatusLoading}
                total={totalData}
                totalLoading={isLoadingTotal}
                hasNextPageFromItems={data?.hasNextPage}
                pageAt={page}
                pageSize={size}
              />
            </>
          )}
        </div>
      </Card>
    </section>
  )
}

export default DeviceResultHistory

import React from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useMutation, useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { DetailHeader, ResultFilter, TableContainer } from '../../../cleanComponents'
import AspectExportListButton from '../../../components/AspectExportListButton'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { RESULT_LIST, RESULT_LIST_TOTAL } from '../../../components/QueryFetch/Result'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import { getTimezoneById } from '../../../utils/utils/timezone'
import getExportableFile from '../ResultQueries'
import messages from './messages'
import { ResultDataTable, ResultDataTableHead, ResultDataTableRow } from './ResultDataTable'
import styles from './ResultList.module.css'
import { getBaseColumns, RESULT_PAGE_SIZE_BUTTON_KEYS } from './utils'

export default function ResultList() {
  const intl = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const [filters] = usePathFilter()
  const {
    sortCol,
    sortDir,
    pageAt: page,
    pageSize: size,
  } = makeSortPageSelector({ sortCol: 'endedOn', sortDir: 'desc' })({ location })

  const { timezoneId } = useSelector(({ user }) => user)
  const validTimeZone = getTimezoneById(timezoneId)

  const params = omitBy(omit({ sortCol, sortDir, page, size, ...filters }, ['assayOverride']), isNil)
  // Request pageSize + 1 items to determine if there's a next page
  const paramsWithExtraItem = { ...params, size: size + 1 }

  const { isLoading, isError, data, error } = useQuery(
    [RESULT_LIST.KEY, { ...paramsWithExtraItem }],
    () => fetchWrapperForQueries({ endpoint: RESULT_LIST.ENDPOINT, params: paramsWithExtraItem }),
    {
      select: ({ data, extraColumns }) => {
        // If we got pageSize + 1 items, there's a next page. Only show pageSize items.
        const hasNextPage = data.length > size
        const items = hasNextPage ? data.slice(0, size) : data
        return {
          items,
          hasNextPage,
          extraColumns,
          columns: getBaseColumns(extraColumns, intl.formatMessage),
        }
      },
    }
  )

  // Deferred query for total count - runs in parallel but doesn't block UI
  const { data: totalData, isLoading: isLoadingTotal } = useQuery(
    [RESULT_LIST_TOTAL.KEY, { ...params }],
    () => fetchWrapperForQueries({ endpoint: RESULT_LIST_TOTAL.ENDPOINT, params }),
    {
      enabled: true, // Run in parallel, non-blocking
      select: ({ total }) => total,
    }
  )

  const { isLoading: isExporting, mutateAsync: onExportClick } = useMutation(formatType =>
    getExportableFile(filters, formatType, sortCol, sortDir, 'results')
  )

  if (isError) throw new Error(error)

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.resultsTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.resultsTitle)} />
        <ResultFilter />
        <DataTableCard key={`DataTableCard__table-Result-list---${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton
              onExport={onExportClick}
              visible={!isEmpty(data?.items)}
              reportName="Results"
              disableExcel
            />
          </div>

          {isLoading || isExporting ? (
            <LinearProgress />
          ) : isEmpty(data?.items) ? (
            <BrowseEmptyList />
          ) : (
            <>
              <TableContainer>
                <ResultDataTable className={styles.ResultDataTable}>
                  <ResultDataTableHead
                    navigate={navigate}
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={data?.columns ?? []}
                  />
                  <TableBody>
                    {data?.items?.map(result => (
                      <ResultDataTableRow
                        key={result.id}
                        intl={intl}
                        extraColumns={data?.extraColumns ?? []}
                        result={result}
                        onClick={e =>
                          gotoWithReturnUrl(
                            `/browse/result/${e.currentTarget.dataset.resultId || 'add'}`,
                            navigate,
                            location
                          )
                        }
                        data-result-id={result.id}
                        messages={messages}
                        timeZone={validTimeZone}
                      />
                    ))}
                  </TableBody>
                </ResultDataTable>
              </TableContainer>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                intl={intl}
                timedMessageUsed={sortCol === 'endedOn'}
                paginatorStatus={messages.paginatorStatus}
                paginatorStatusLoading={messages.paginatorStatusLoading}
                total={totalData}
                totalLoading={isLoadingTotal}
                hasNextPageFromItems={data?.hasNextPage}
                pageAt={page}
                pageSize={size}
                pageSizeButtonKeys={RESULT_PAGE_SIZE_BUTTON_KEYS}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </>
  )
}

import React, { useEffect, useRef } from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useMutation, useQuery } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { DetailHeader, ResultFilter, TableContainer } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { RESULT_LIST, RESULT_LIST_TOTAL } from '../../../components/QueryFetch/Result'
import DataTableCard from '../../../components/shared/DataTableCard'
import useAuthState from '../../../hooks/useAuthState'
import { usePathFilter } from '../../../hooks/usePathFilter'
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

  // Track previous filters to detect changes
  const prevFiltersRef = useRef(filters)
  const isInitialMount = useRef(true)

  // Reset page to 0 when filters change (but not when just paginating or sorting)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevFiltersRef.current = filters
      return
    }

    // Only reset page if filters actually changed (not just page/sort)
    const filtersChanged = !isEqual(prevFiltersRef.current, filters)

    if (filtersChanged && page !== 0) {
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('pageAt', '0')
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }

    prevFiltersRef.current = filters
  }, [filters, page, location, navigate])

  const { timezoneId } = useAuthState()
  const validTimeZone = getTimezoneById(timezoneId)

  const params = omitBy(omit({ sortCol, sortDir, page, size, ...filters }, ['assayOverride']), isNil)

  const { isLoading, isError, data, error } = useQuery(
    [RESULT_LIST.KEY, { ...params }],
    () => fetchWrapperForQueries({ endpoint: RESULT_LIST.ENDPOINT, params }),
    {
      select: ({ data, extraColumns, hasNextPage }) => {
        return {
          items: data,
          hasNextPage,
          extraColumns,
          columns: getBaseColumns(extraColumns, intl.formatMessage),
        }
      },
    }
  )

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

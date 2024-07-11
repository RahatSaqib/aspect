import React from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useMutation, useQuery } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { DetailHeader, ResultFilter } from '../../../cleanComponents'
import AspectExportListButton from '../../../components/AspectExportListButton'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { RESULT_LIST } from '../../../components/QueryFetch/Result'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
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

  const params = omitBy(omit({ sortCol, sortDir, page, size, ...filters }, ['assayOverride']), isNil)
  const { isLoading, isError, data, error } = useQuery(
    [RESULT_LIST.KEY, { ...params }],
    () => fetchWrapperForQueries({ endpoint: RESULT_LIST.ENDPOINT, params }),
    {
      select: ({ data, total, extraColumns }) => ({
        items: data,
        total,
        extraColumns,
        columns: getBaseColumns(extraColumns, intl.formatMessage),
      }),
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
                    />
                  ))}
                </TableBody>
              </ResultDataTable>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                intl={intl}
                timedMessageUsed={sortCol === 'endedOn'}
                paginatorStatus={messages.paginatorStatus}
                total={data?.total}
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

import React, { useEffect, useState } from 'react'
import { TableBody, Table } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import useWorkload from '../../../hooks/device/useWorkload'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import {
  reduceFiltersConfig,
  getFilters,
  sanitizeFiltersStringBy,
  setFiltersForLast30Days,
} from '../../../oldComponents/filter/utils'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import colMessages from '../../../oldPages/result/list/messages'
import { useAuthState } from '../../../providers/AuthProvider'
import { makeSortPageSelector, makeSearchParamsSanitizer } from '../../../utils/selectors/searchParams'
import messages from './messages'
import TableRow from './TableRow'
import styles from './Workload.css'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { date: true, requiredPermissions: [] },
  { assayId: true, requiredPermissions: [] },
  { deviceName: true, requiredPermissions: ['device'] },
  { deviceMaintenanceStatus: true, requiredPermissions: [] },
]

const availableSortCol = [
  'name',
  'deviceStatus',
  'lastPingOn',
  'firstResultConductedOn',
  'lastResultConductedOn',
  'totalTests',
]

const searchSanitizer = makeSearchParamsSanitizer({ availableSortCol })
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)

const Workload = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useI18n()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const [firstLoad, setFirstLoad] = useState(true)
  const [requestParams, setRequestParams] = useState()

  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions, {})

  const { isError, isLoading, data = false, error } = useWorkload(requestParams)

  const sortPage = makeSortPageSelector({ sortCol: 'name', sortDir: 'asc', pageSize: 50 })

  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location, availableSortCol, dependencies: {} })

  const mostResultsAssay = useSelector(
    ({ assay }) =>
      assay.items
        .toJS()
        .filter(a => a.hasResults)
        .sort((a, b) => b.resultCount - a.resultCount)[0]
  )

  useEffect(() => {
    const { value: searchParams } = searchSanitizer(location, {})
    const { value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '', {})
    searchParams.set('filters', filtersParams)
    if (firstLoad) {
      setFiltersForLast30Days(searchParams)
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      filtersParams.set('assayId', +mostResultsAssay.id)
      searchParams.set('filters', filtersParams)
      setFirstLoad(false)
      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }

    const filters = getFilters(filtersParams)
    setRequestParams({ sortCol, sortDir, page: pageAt, size: pageSize, ...filters })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate, firstLoad, sortCol, sortDir, pageAt, pageSize])

  if (isError) throw new Error(error)

  const { data: workloadList, total, extraColumns } = data || { data: [], total: 0, extraColumns: [] }

  const columns = [
    { key: 'name', label: formatMessage(messages.name), sortable: true },
    { key: 'deviceStatus', label: formatMessage(messages.deviceStatus), sortable: true },
    { key: 'lastPingOn', label: formatMessage(messages.lastPingOn), sortable: true },
    { key: 'firstResultConductedOn', label: formatMessage(messages.firstResultConductedOn), sortable: true },
    { key: 'lastResultConductedOn', label: formatMessage(messages.lastResultConductedOn), sortable: true },
    { key: 'totalTests', label: formatMessage(messages.totalTests), sortable: true },
    ...extraColumns.map(c => ({
      key: c.fieldId,
      label: `${formatMessage(colMessages[c.resultCategoryLabelI18nKey])} ${formatMessage(
        colMessages[c.resultCategoryI18nKey]
      )}`,
      sortable: false,
    })),
  ]
  const extraColumnsProps = extraColumns.map(ec => ec.fieldId)

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={formatMessage(messages.workloadTitle)} />
      <BrowseFilters
        navigate={navigate}
        location={location}
        config={reducedFilters}
        dateFilterLabel={formatMessage(messages.date)}
      />
      <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
        <DataTableProgressBar disabled={!isLoading} />
        {workloadList.length ? (
          <>
            <Table className={cssClasses('InventoryDataTable')}>
              <DataTableHead sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
              <TableBody>
                {workloadList.map((item, index) => (
                  <TableRow key={`workload--${index}`} item={item} extraColumns={extraColumnsProps} />
                ))}
              </TableBody>
            </Table>
            <BrowseTablePaginator
              navigate={navigate}
              location={location}
              pageSizeButtonKeys={[10, 25, 50, 100]}
              paginatorStatus={messages.paginatorStatus}
              total={total}
              pageAt={pageAt}
              pageSize={pageSize}
            />
          </>
        ) : (
          <BrowseEmptyList navigate={navigate} location={location} />
        )}
      </DataTableCard>
    </div>
  )
}

export default Workload

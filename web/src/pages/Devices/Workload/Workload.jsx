import React, { useEffect, useState } from 'react'
import { TableBody, Table } from '@mui/material'
import classnames from 'classnames/bind'
import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import subtractDays from 'date-fns/subDays'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import DeviceWorkloadFilter from '../../../cleanComponents/Filter/DeviceWorkloadFilter'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import DetailHeader from '../../../components/DetailHeader'
import useI18n from '../../../hooks/useI18n'
import useWorkload from '../../../hooks/workload/useWorkload'
import useWorkloadDownload from '../../../hooks/workload/useWorkloadDownload'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import { getFilters, sanitizeFiltersStringBy } from '../../../oldComponents/filter/utils'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import colMessages from '../../../oldPages/result/list/messages'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterUpdate, useFilterValues } from '../../../providers/FilterProvider'
import { makeSortPageSelector, makeSearchParamsSanitizer } from '../../../utils/selectors/searchParams'
import messages from './messages'
import styles from './styles.css'
import TableRow from './TableRow'

// There are some missing translations for the status, you should check what we are actually doing in device table.
// BD MGIT columnas

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { date: true, requiredPermissions: [] },
  { singleAssayId: true, requiredPermissions: [] },
  { deviceName: true, requiredPermissions: ['device'] },
]

const availableSortCol = [
  'name',
  'deviceStatus',
  'lastPingOn',
  'firstResultEndedOn',
  'lastResultEndedOn',
  'totalTests',
  'stateName',
  'lgaName',
]

const searchSanitizer = makeSearchParamsSanitizer({ availableSortCol })
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)

const Workload = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useI18n()
  const filter = useFilterValues(location.pathname)
  const [addFilter] = useFilterUpdate()
  const user = useAuthState()
  const [, setRequestParams] = useState()
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const { isError, isLoading, data = false, error } = useWorkload(filter)
  const sortPage = makeSortPageSelector({ sortCol: 'name', sortDir: 'asc', pageSize: 50 })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location, availableSortCol, dependencies: {} })
  const mostResultsAssay = useSelector(
    ({ assay }) =>
      assay.items
        .toJS()
        .filter(a => a.hasResults)
        .sort((a, b) => b.resultCount - a.resultCount)[0]
  )
  useWorkloadDownload({ ...filter, ...download })

  const onExcelClick = formatType => setDownload({ fileFormat: formatType, enabled: true })

  useEffect(() => {
    if (download.enabled) {
      setDownload({ fileFormat: '', enabled: false })
    }
  }, [download])

  useEffect(() => {
    if (filter.singleAssayId !== mostResultsAssay?.id) {
      addFilter({ ...filter, singleAssayId: mostResultsAssay?.id }, location.pathname)
    }
  }, [addFilter, filter, location, mostResultsAssay])

  useEffect(() => {
    const { value: searchParams } = searchSanitizer(location, {})
    const { value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '', {})

    if (!filtersParams.has('singleAssayId') && mostResultsAssay !== undefined) {
      const now = new Date()
      filtersParams.set('minDate', startOfDay(subtractDays(now, now.getDate() - 1)).toJSON())
      filtersParams.set('maxDate', endOfDay(now).toJSON())
      filtersParams.set('singleAssayId', mostResultsAssay?.id)
      searchParams.set('filters', filtersParams)
      if (searchParams.has('pageAt')) {
        searchParams.delete('pageAt')
      }
      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
  }, [location, mostResultsAssay, navigate])

  useEffect(() => {
    const { value: searchParams } = searchSanitizer(location, {})
    const { value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '', {})

    const filters = getFilters(filtersParams)
    if (filters.singleAssayId) {
      setRequestParams({ sortCol, sortDir, page: pageAt, size: pageSize, ...filters })
    }
  }, [location, pageAt, pageSize, sortCol, sortDir])

  if (isError) throw new Error(error)

  const { data: workloadList, total, extraColumns } = data || { data: [], total: 0, extraColumns: [] }

  const columns = [
    { key: 'name', label: formatMessage(messages.name), sortable: true },
    { key: 'deviceStatus', label: formatMessage(messages.deviceStatus), sortable: true, hiddenOn: 'xl' },
    { key: 'stateName', label: getCustomMessage(messages, 'state', user), sortable: true, hiddenOn: 'xl' },
    { key: 'lgaName', label: getCustomMessage(messages, 'lga', user), sortable: true, hiddenOn: 'xl' },
    { key: 'lastPingOn', label: formatMessage(messages.lastPingOn), sortable: true, hiddenOn: 'xl' },
    { key: 'firstResultEndedOn', label: formatMessage(messages.firstResultEndedOn), sortable: true, hiddenOn: 'xl' },
    { key: 'lastResultEndedOn', label: formatMessage(messages.lastResultEndedOn), sortable: true, hiddenOn: 'xl' },
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
    <>
      <DetailHeader name={formatMessage(messages.workloadTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.workloadTitle)} />
        <DeviceWorkloadFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton onExport={onExcelClick} visible={workloadList.length} reportName="DeviceWorkload" />
          </div>

          <DataTableProgressBar disabled={!isLoading} />
          {workloadList.length === 0 ? (
            <BrowseEmptyList navigate={navigate} location={location} />
          ) : (
            <>
              <div style={{ overflowY: 'hidden', overflowX: 'scroll' }}>
                <Table className={cssClasses('InventoryDataTable')}>
                  <DataTableHead sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
                  <TableBody>
                    {workloadList.map((item, index) => (
                      <TableRow key={`workload--${index}`} item={item} extraColumns={extraColumnsProps} />
                    ))}
                  </TableBody>
                </Table>
              </div>
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
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default Workload

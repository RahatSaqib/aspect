import flowRight from 'lodash/flowRight'
import isEmpty from 'lodash/isEmpty'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Immutable from 'immutable'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import { useQuery } from 'react-query'

import { makeSortPageSelector, makeSearchParamsSanitizer, composeSanitizer } from '../../shared/selectors/searchParams'

import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../filter/utils'

import { useAuthState } from '../../Providers/AuthProvider'
import { receiveTableItems, Table } from '../../shared/metaReducers/table'
import { receiveListWithSet, Items } from '../../shared/metaReducers/items'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import getExportableFile from '../DeviceQueries'
import ExportListButton from '../../MigratedComponents/AspectExportListButton'
import { DeviceDataTable, DeviceDataTableHead, DeviceDataTableRow } from './DeviceDataTable'
import { DEVICE_LIST } from '../../MigratedComponents/QueryFetch/Device/index'
import messages from './messages'

import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch/index'

import styles from './DeviceList.css'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  {
    assayId: true,
    requiredPermissions: [],
  },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view'],
  },
  {
    deviceName: true,
    requiredPermissions: ['device'],
  },
  {
    deviceMaintenanceStatus: true,
    requiredPermissions: [],
  },
  {
    deviceType: true,
    requiredPermissions: [],
  },
  {
    deviceApproval: true,
    requiredPermissions: [],
  },
  {
    issueTypeId: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'name',
    'siteName',
    'statusI18nKey',
    'availabilityRate',
    'errorRate',
    'createdOn',
    'lastPingOn',
    'resultCountLastMonth',
    'resultCountThisMonth',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const getColumns = intl => [
  {
    key: 'name',
    label: intl.formatMessage(messages.device),
    sortable: true,
  },
  {
    key: 'siteName',
    label: intl.formatMessage(messages.site),
    sortable: true,
    hiddenOn: 'lg',
  },
  {
    key: 'statusI18nKey', // TODO: as the sorting occurs on the API, if we have this key in different languages, then probably the sorting won't work correctly
    label: intl.formatMessage(messages.status),
    sortable: true,
  },
  {
    key: 'availabilityRate',
    label: intl.formatMessage(messages.availabilityRate),
    sortable: false,
    tooltip: intl.formatMessage(messages.availabilityRateDescription),
  },
  {
    key: 'errorRate',
    label: intl.formatMessage(messages.errorRate),
    sortable: false,
    tooltip: intl.formatMessage(messages.errorRateDescription),
  },
  {
    key: 'issueCategory',
    label: intl.formatMessage(messages.issueCategory),
  },
  {
    key: 'createdOn',
    sortable: true,
    label: intl.formatMessage(messages.reportingFor),
  },
  {
    key: 'lastPingOn',
    sortable: true,
    label: intl.formatMessage(messages.lastSeen),
    tooltip: intl.formatMessage(messages.lastSeenDescription),
  },
  {
    key: 'resultCountLastMonth',
    sortable: true,
    label: intl.formatMessage(messages.lastMonth),
    hiddenOn: 'lg',
  },
  {
    key: 'resultCountThisMonth',
    sortable: true,
    label: intl.formatMessage(messages.thisMonth),
    hiddenOn: 'lg',
  },
]

export const DeviceListWithProps = ({
  intl,
  navigate,
  location,
  isLoading,
  items,
  sortCol,
  sortDir,
  reducedFilters,
  onExportClick,
  columns,
  total,
  pageAt,
  pageSize,
  displayPreferences,
  onRowClick,
  onAlertClick,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.devicesTitle)} />
    <NavTitle title={intl.formatMessage(messages.devicesTitle)} />
    <BrowseFilters navigate={navigate} location={location} intl={intl} config={reducedFilters} />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!isLoading} />
      <ExportListButton onExport={onExportClick} visible={!items.currentIdList.isEmpty()} />
      {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
      {!items.currentIdList.isEmpty() && (
        <DeviceDataTable className={cssClasses('DeviceDataTable')}>
          <DeviceDataTableHead
            navigate={navigate}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={columns}
          />
          <TableBody>
            {!items.currentIdList.isEmpty() &&
              items.currentIdList
                .map(id => items.byId.get(id))
                .map(device => (
                  <DeviceDataTableRow
                    key={device.get('id')}
                    intl={intl}
                    device={device}
                    onClick={onRowClick}
                    onAlertClick={onAlertClick}
                    displayPreferences={displayPreferences}
                    data-device-id={device.get('id')}
                  />
                ))}
          </TableBody>
        </DeviceDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          navigate={navigate}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
  </div>
)

export const DeviceList = () => {
  // >>>>>> Hooks <<<<<<
  const intl = useIntl()
  const navigate = useNavigate()
  const {
    jwt: { permissions: userPermissions },
    displayPreferences,
  } = useAuthState()
  const location = useLocation()

  // >>>>>> Local state <<<<<<
  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(new Table())
  const [total, setTotal] = useState()
  const [filters, setFilters] = useState()
  const [pagination, setPagination] = useState({})

  // >>>>>> Constants <<<<<<
  const { sortCol, sortDir, page, size } = pagination
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const params = { ...pagination, ...filters }

  const onRowClick = ({
    currentTarget: {
      dataset: { deviceId },
    },
  }) => navigate(`/browse/device/${deviceId}`)

  const onAlertClick = event => {
    event.stopPropagation()
    const {
      currentTarget: {
        dataset: { deviceId },
      },
    } = event
    navigate(`/browse/device/${deviceId}/alerts`)
  }

  // >>>>>> Queries <<<<<<
  const {
    data = false,
    isError,
    error,
    isLoading,
  } = useQuery(
    [DEVICE_LIST.KEY, { params }],
    async () =>
      fetchWrapperForQueries({
        endpoint: DEVICE_LIST.ENDPOINT,
        params: { ...params, hasResults: 1 },
      }),
    { enabled: !isEmpty(params) }
  )

  // >>>>>> Lifecycles <<<<<<
  useEffect(() => {
    if (!isLoading && data) {
      const { data: list, total: totalItems } = data
      setItems(receiveListWithSet(items, Immutable.fromJS(list)))
      setTotal(totalItems)
      setTable(receiveTableItems(table, totalItems))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }

    const sortPage = makeSortPageSelector({
      sortCol: 'name',
    })
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setFilters(getFilters(filtersParams))
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // >>>>>> Callbacks <<<<<<
  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      return getExportableFile(filtersParams, formatType, sortCol, sortDir, 0, total, 'devices')
    }
  }

  if (isError) {
    throw new Error(error)
  }

  const baseProps = {
    intl,
    navigate,
    location,
    isLoading,
    items,
    sortCol,
    sortDir,
    columns: getColumns(intl),
    reducedFilters,
    onExportClick,
    table,
    total,
    pageAt: page,
    pageSize: size,
    displayPreferences,
    onRowClick,
    onAlertClick,
  }
  return <DeviceListWithProps {...baseProps} />
}

export default DeviceList

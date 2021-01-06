import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import Immutable from 'immutable'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import { useQuery } from 'react-query'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import { receiveTableItems, Table } from '../../shared/metaReducers/table'
import { receiveList, Items } from '../../shared/metaReducers/items'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import getExportableFile from '../NotificationQueries'
import ExportListButton from '../../MigratedComponents/AspectExportListButton'
import {
  NotificationDataTable,
  NotificationDataTableHead,
  NotificationDataTableRow,
} from './NotificationDataTable'
import { NOTIFICATION_LIST } from '../../MigratedComponents/QueryFetch/Notification/index'
import messages from './messages'

import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch/index'

const cssClasses = classnames.bind(require('./NotificationList.css'))

const FILTERS_CONFIG = [{ notificationName: true, requiredPermissions: [] }]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const getColumns = intl => [
  {
    key: 'name',
    label: intl.formatMessage(messages.notificationsName),
    sortable: true,
  },
  {
    key: 'lastTriggeredOn',
    label: intl.formatMessage(messages.lastTriggered),
    sortable: true,
  },
  {
    key: 'totalTriggers',
    label: intl.formatMessage(messages.totalTriggers),
    sortable: true,
  },
  {
    key: 'contacts',
    label: intl.formatMessage(messages.contacts),
    sortable: true,
  },
  {
    key: 'actions',
  },
]

export const NotificationListWithProps = ({
  intl,
  history,
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
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
    <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
    />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!isLoading} />
      <ExportListButton
        onExport={onExportClick}
        visible={!items.currentIdList.isEmpty()}
      />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <NotificationDataTable
          selectable={false}
          className={cssClasses('NotificationDataTable')}
        >
          <NotificationDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={columns}
          />
          <TableBody>
            {!items.currentIdList.isEmpty() &&
              items.currentIdList
                .map(id => items.byId.get(id))
                .map(notification => (
                  <NotificationDataTableRow
                    key={notification.id}
                    notification={Immutable.Map(notification)}
                    data-notification-id={notification.id}
                  />
                ))}
          </TableBody>
        </NotificationDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
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

export const NotificationList = () => {
  // >>>>>> Hooks <<<<<<
  const intl = useIntl()
  const history = useHistory()
  const userPermissions = useSelector(state => state.user.jwt.permissions)
  const location = useLocation()

  // >>>>>> Local state <<<<<<
  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(
    new Table({
      sortCol: 'name',
      sortDir: 'desc',
      filters: Immutable.fromJS({
        name: '',
      }),
    })
  )
  const [total, setTotal] = useState()
  const [filters, setFilters] = useState()
  const [pagination, setPagination] = useState({})

  // >>>>>> Constants <<<<<<
  const { sortCol, sortDir, page, size } = pagination
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const params = { ...pagination, ...filters }

  // >>>>>> Queries <<<<<<
  const { data = false, isError, error, isLoading } = useQuery(
    [NOTIFICATION_LIST.KEY, { params }],
    async () =>
      fetchWrapperForQueries({
        endpoint: NOTIFICATION_LIST.ENDPOINT,
        params,
      })
  )

  // >>>>>> Lifecycles <<<<<<
  useEffect(() => {
    if (!isLoading && data) {
      const { data: list, total: totalItems } = data
      setItems(receiveList(items, Immutable.fromJS(list)))
      setTotal(totalItems)

      setTable(receiveTableItems(table, totalItems))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const {
      sanitized: filtersSanitized,
      value: filtersParams,
    } = filtersSanitizer(searchParams.get('filters') || '')

    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    }

    const sortPage = makeSortPageSelector({
      sortCol: 'name',
    })
    const urlSearchParams = new URLSearchParams(location.search)
    const urlFilters = urlSearchParams.get('filters')
      ? new URLSearchParams(urlSearchParams.get('filters'))
      : []
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setFilters(fromPairs([...urlFilters.entries()]))
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // >>>>>> Callbacks <<<<<<
  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      return getExportableFile(
        filtersParams,
        formatType,
        sortCol,
        sortDir,
        page,
        size,
        'notifications'
      )
    }
  }

  if (isError) {
    throw new Error(error)
  }

  const baseProps = {
    intl,
    history,
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
  }

  return <NotificationListWithProps {...baseProps} />
}

export default NotificationList

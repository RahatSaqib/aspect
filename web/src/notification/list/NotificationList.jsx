import flowRight from 'lodash/flowRight'
import identity from 'lodash/identity'
import isNil from 'lodash/isNil'
import fromPairs from 'lodash/fromPairs'
import classnames from 'classnames/bind'
import { useIntl, defineMessages, injectIntl } from 'react-intl'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import { useQuery } from 'react-query'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
} from '../../error/CommonErrorNotifications'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { exportNotifications } from '../NotificationRedux'
import ExportListButton from '../../globals/components/ExportListButton'
import {
  NotificationDataTable,
  NotificationDataTableHead,
  NotificationDataTableRow,
} from './NotificationDataTable'
import { NOTIFICATION_LIST } from '../../MigratedComponents/QueryFetch/Notification/index'

import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch/index'

const cssClasses = classnames.bind(require('./NotificationList.css'))

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.title',
    defaultMessage: 'Notifications',
  },
  notificationsName: {
    id: 'pages.NotificationList.name',
    defaultMessage: 'Name',
  },
  lastTriggered: {
    id: 'pages.NotificationList.lastTriggered',
    defaultMessage: 'Last triggered',
  },
  totalTriggers: {
    id: 'pages.NotificationList.totalTriggers',
    defaultMessage: 'Total triggers',
  },
  contacts: {
    id: 'pages.NotificationList.contacts',
    defaultMessage: 'Contacts',
  },
  paginatorStatus: {
    id: 'pages.NotificationList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# notification}
      other {# notifications}
    }`,
  },
})

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

export const NotificationList = props => {
  const {
    intl,
    history,
    location,
    table,
    userPermissions,
    sortCol,
    sortDir,
    pageAt,
    pageSize,
    exportNotifications,
  } = props

  const { data: { data } = false, isError, error } = useQuery(
    [NOTIFICATION_LIST.KEY, pageAt, pageSize, location.search],
    async () => {
      const { value: filtersParams } = filtersFromLocation(location)
      const filters = fromPairs([...filtersParams.entries()])
      return fetchWrapperForQueries({
        endpoint: NOTIFICATION_LIST.ENDPOINT,
        customErrorNotifications: [
          {
            400: filterFieldsRejectedError(
              defineMessages({
                title: {
                  id: 'errorResponseMessages.fetchNotifications.GET.400.title',
                  defaultMessage: 'Searching Notifications Failed',
                },
              })
            ),
            default: errorPleaseTryAgainInAFewMinutes(
              defineMessages({
                title: {
                  id:
                    'errorResponseMessages.fetchNotifications.GET.default.title',
                  defaultMessage: 'Loading Notifications Failed',
                },
              })
            ),
          },
        ],
        params: {
          page: pageAt,
          size: pageSize,
          ...filters,
          sortCol,
          sortDir,
        },
      })
    }
  )
  const setFilters = () => {
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
    setReducedFilters(reduceFiltersConfig(FILTERS_CONFIG, userPermissions))
  }

  useEffect(() => {
    setFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])
  if (isError) {
    throw new Error(error)
  }

  const [reducedFilters, setReducedFilters] = useState({
    name: true,
  })

  const onExcelClick = formatType => {
    const format = formatType.id
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      exportNotifications(
        filtersParams,
        sortCol,
        sortDir,
        pageAt,
        table.get('total') > 0 ? table.get('total') : 1,
        format,
        'notifications'
      )
    }
  }
  const emptyList = isNil(data) || data.length === 0
  return (
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
        <DataTableProgressBar disabled={!table.loading} />
        <ExportListButton
          onExcelClick={onExcelClick}
          visible={!emptyList}
          onCsvClick={onExcelClick}
          reportName="Notifications"
        />
        {emptyList && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!emptyList && (
          <NotificationDataTable
            selectable={false}
            className={cssClasses('NotificationDataTable')}
          >
            <NotificationDataTableHead
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
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
              ]}
            />
            <TableBody>
              {!emptyList &&
                data.map(notification => (
                  <NotificationDataTableRow
                    key={notification.id}
                    notification={Immutable.Map(notification)}
                    data-notification-id={notification.id}
                  />
                ))}
            </TableBody>
          </NotificationDataTable>
        )}
        {!emptyList && (
          <BrowseTablePaginator
            history={history}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={table.total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </DataTableCard>
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({
    sortCol: 'name',
    sortDir: 'desc',
  })({ location: ownProps.location })
  return {
    items: state.notification.items,
    table: state.notification.table,
    userPermissions: state.user.jwt.permissions,
    sortCol,
    sortDir,
    pageAt,
    pageSize,
  }
}

NotificationList.defaultProps = {
  sortCol: 'name',
  sortDir: 'desc',
}

NotificationList.propTypes = {
  intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  table: PropTypes.instanceOf(Immutable.Record).isRequired,
  exportNotifications: PropTypes.func.isRequired,
  userPermissions: PropTypes.instanceOf(Immutable.Set).isRequired,
  sortCol: PropTypes.string,
  sortDir: PropTypes.string,
  pageAt: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
}

export default NotificationList
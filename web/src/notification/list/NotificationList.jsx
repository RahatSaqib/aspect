import flowRight from 'lodash/flowRight'
import classnames from 'classnames/bind'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'

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
import { fetchNotifications, exportNotifications } from '../NotificationRedux'
import ExportListButton from '../../globals/components/ExportListButton'
import {
  NotificationDataTable,
  NotificationDataTableHead,
  NotificationDataTableRow,
} from './NotificationDataTable'

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
  issues: {
    id: 'pages.NotificationList.issues',
    defaultMessage: 'Issues',
  },
  sms: {
    id: 'pages.NotificationList.sms',
    defaultMessage: 'SMS',
  },
  email: {
    id: 'pages.NotificationList.email',
    defaultMessage: 'Email',
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
  availableSortCol: [
    'name',
    'lastTriggeredOn',
    'totalTriggers',
    'alertCount',
    'emailCount',
    'smsCount',
  ],
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
    items,
    fetchNotifications,
    userPermissions,
    sortCol,
    sortDir,
    pageAt,
    pageSize,
    exportNotifications,
  } = props

  useEffect(
    () => {
      onInitialLoad()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search]
  )
  const onInitialLoad = () => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      fetchNotifications(filtersParams, sortCol, sortDir, pageAt, pageSize)
    }
  }
  const [reducedFilters, setReducedFilters] = useState({
    name: true,
  })
  useEffect(() => {
    setFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
  const onRowClick = ({
    currentTarget: {
      dataset: { notificationId },
    },
  }) => history.push(`/browse/notification/${notificationId}/history`)

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
          visible={!items.currentIdList.isEmpty()}
          onCsvClick={onExcelClick}
          reportName="Notifications"
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
                  key: 'alertCount',
                  label: intl.formatMessage(messages.issues),
                  sortable: true,
                },
                {
                  key: 'smsCount',
                  label: intl.formatMessage(messages.sms),
                  sortable: true,
                },
                {
                  key: 'emailCount',
                  label: intl.formatMessage(messages.email),
                  sortable: true,
                },
                {
                  key: 'actions',
                },
              ]}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(notification => (
                  <NotificationDataTableRow
                    key={notification.get('id')}
                    intl={intl}
                    notification={notification}
                    // onClick={onRowClick}
                    data-notification-id={notification.get('id')}
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
  intl: PropTypes.oneOf(['PropTypes.Object']).isRequired,
  location: PropTypes.oneOf(['PropTypes.Object']).isRequired,
  history: PropTypes.oneOf(['PropTypes.Object']).isRequired,
  table: PropTypes.instanceOf(Immutable.Record).isRequired,
  items: PropTypes.instanceOf(Immutable.Record).isRequired,
  fetchNotifications: PropTypes.func.isRequired,
  exportNotifications: PropTypes.func.isRequired,
  userPermissions: PropTypes.instanceOf(Immutable.Set).isRequired,
  sortCol: PropTypes.string,
  sortDir: PropTypes.string,
  pageAt: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
}

export default flowRight(
  injectIntl,
  connect(mapStateToProps, {
    fetchNotifications,
    exportNotifications,
  })
)(NotificationList)

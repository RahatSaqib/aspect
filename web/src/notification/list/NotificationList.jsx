import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchNotifications } from '../NotificationRedux'
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
  type: {
    id: 'pages.NotificationList.type',
    defaultMessage: 'Type',
  },
  name: {
    id: 'pages.NotificationList.name',
    defaultMessage: 'Name',
  },
  assignedContacts: {
    id: 'pages.NotificationList.assignedContacts',
    defaultMessage: 'Assigned Contacts',
  },
  paginatorStatus: {
    id: 'pages.NotificationList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# notification}
      other {# notifications}
    }`,
  },
})

const FILTERS_CONFIG = {
  contactNameOrEmail: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['type', 'name', 'assignedContacts'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    })
  ),
  connect(
    state => ({
      items: state.notification.items,
      table: state.notification.table,
    }),
    bindActionCreators.bind(null, {
      fetchNotifications,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchNotifications,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchNotifications(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onHeadColumnClick: ({ history, location, sortCol, sortDir }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { notificationId } },
    }) => history.push(`/browse/notification/${notificationId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const NotificationList = ({
  intl,
  history,
  location,
  table,
  items,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onHeadColumnClick,
  onRowClick,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
    <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <NotificationDataTable
          selectable={false}
          className={cssClasses('NotificationDataTable')}
        >
          <NotificationDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'type',
                label: intl.formatMessage(messages.type),
                onClick: onHeadColumnClick,
              },
              {
                key: 'name',
                label: intl.formatMessage(messages.name),
                onClick: onHeadColumnClick,
              },
              {
                key: 'assignedContacts',
                label: intl.formatMessage(messages.assignedContacts),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(notification => (
              <NotificationDataTableRow
                key={notification.get('id')}
                intl={intl}
                notification={notification}
                onClick={onRowClick}
                data-notification-Id="detail"
              />
            ))}
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

export default enhance(NotificationList)

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
  lastTriggered: {
    id: 'pages.NotificationList.lastTriggered',
    defaultMessage: 'Last triggered',
  },
  recipients: {
    id: 'pages.NotificationList.recipients',
    defaultMessage: 'Recipients',
  },
  totalTriggers: {
    id: 'pages.NotificationList.totalTriggers',
    defaultMessage: 'Total triggers',
  },
  errors: {
    id: 'pages.NotificationList.errors',
    defaultMessage: 'Errors',
  },
  paginatorStatus: {
    id: 'pages.NotificationList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# notification}
      other {# notifications}
    }`,
  },
})

const FILTERS_CONFIG = [
  {
    contactNameOrEmail: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'alertName',
    'lastTriggeredOn',
    'recipientsCount',
    'triggersCount',
    'errorsCount',
  ],
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
      sortCol: 'lastTriggeredOn',
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
      items: state.notification.items,
      table: state.notification.table,
      userPermissions: state.user.jwt.permissions,
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
      const reducedFilters = reduceFiltersConfig(
        FILTERS_CONFIG,
        this.props.userPermissions
      )
      this.setState({
        reducedFilters,
      })
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
  onRowClick,
  reducedFilters,
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
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'alertType',
              },
              {
                key: 'alertName',
                sortable: true,
              },
              {
                key: 'lastTriggeredOn',
                label: intl.formatMessage(messages.lastTriggered),
                sortable: true,
              },
              {
                key: 'recipientsCount',
                label: intl.formatMessage(messages.recipients),
                sortable: true,
              },
              {
                key: 'triggersCount',
                label: intl.formatMessage(messages.totalTriggers),
                sortable: true,
              },
              {
                key: 'errorsCount',
                label: intl.formatMessage(messages.errors),
                sortable: true,
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
                data-notification-id="detail"
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

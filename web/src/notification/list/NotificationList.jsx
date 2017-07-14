import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredNotifications } from '../NotificationRedux'
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

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.notification.items,
      table: state.notification.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredNotifications,
      configureListFilter,
    })
  ),
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredNotifications, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredNotifications(
        {},
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { notificationId } },
    }) => history.push(`/browse/notification/${notificationId}`),
    onPageChange: ({ fetchListFilteredNotifications, table }) => nextPage =>
      fetchListFilteredNotifications(
        {},
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredNotifications, table }) => nextPageSize =>
      fetchListFilteredNotifications(
        {},
        table.sortCol,
        table.sortDir,
        0,
        nextPageSize
      ),
  }),
  lifecycle({
    componentWillMount() {
      const { configureListFilter } = this.props
      configureListFilter({ contactNameOrEmail: true })
    },

    componentDidMount() {
      this.props.onPageChange(0)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.listFilter !== nextProps.listFilter) {
        this.props.onPageChange(0)
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
  onHeadColumnClick,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet
      title={intl.formatMessage(messages.notificationsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
    />
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <Card className={cssClasses('Card')}>
        <ProgressBar
          mode={table.loading ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
          className={cssClasses('ProgressBar')}
          theme={{
            indeterminate: cssClasses('ProgressBar--indeterminate'),
          }}
        />
        <NotificationDataTable
          selectable={false}
          className={cssClasses('NotificationDataTable')}
        >
          <NotificationDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
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
            .map(notification =>
              <NotificationDataTableRow
                key={notification.get('id')}
                intl={intl}
                notification={notification}
                onClick={onRowClick}
                data-notification-Id={notification.get('id')}
              />
            )}
        </NotificationDataTable>
        <TablePaginator
          className={cssClasses('TablePaginator')}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Card>}
  </div>

export default enhance(NotificationList)

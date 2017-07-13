import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import {
  RouterDataTable,
  RouterDataTableHead,
  RouterDataTableRow,
} from './RouterDataTable'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredRouters } from '../RouterRedux'

const cssClasses = classnames.bind(require('./RouterList.css'))

const messages = defineMessages({
  routersTitle: {
    id: 'pages.RouterList.routersTitle',
    defaultMessage: 'Routers',
  },
  routerName: {
    id: 'pages.RouterList.routerName',
    defaultMessage: 'Router Name',
  },
  status: {
    id: 'pages.RouterList.status',
    defaultMessage: 'Status',
  },
  reportingFor: {
    id: 'pages.RouterList.reportingFor',
    defaultMessage: 'Reporting For',
  },
  lastSeen: {
    id: 'pages.RouterList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  paginatorStatus: {
    id: 'pages.RouterList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# router}
      other {# routers}
    }`,
  },
})

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.router.items,
      table: state.router.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredRouters,
      configureListFilter,
    })
  ),
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredRouters, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredRouters(
        { hasResults: 0, hasConnectivity: 1 },
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { routerId } },
    }) => history.push(`/browse/router/${routerId}`),
    onPageChange: ({ fetchListFilteredRouters, table }) => nextPage =>
      fetchListFilteredRouters(
        { hasResults: 0, hasConnectivity: 1 },
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredRouters, table }) => nextPageSize =>
      fetchListFilteredRouters(
        { hasResults: 0, hasConnectivity: 1 },
        table.sortCol,
        table.sortDir,
        0,
        nextPageSize
      ),
  }),
  lifecycle({
    componentWillMount() {
      this.props.configureListFilter({
        geography: true,
        deviceName: true,
        deviceStatus: true,
      })
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

export const RouterList = ({
  intl,
  history,
  location,
  table,
  items,
  //
  onHeadColumnClick,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet
      title={intl.formatMessage(messages.routersTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.routersTitle)} />
    <BrowseFilters history={history} location={location} intl={intl} />
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
        <RouterDataTable
          selectable={false}
          className={cssClasses('RouterDataTable')}
        >
          <RouterDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.routerName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'status',
                label: intl.formatMessage(messages.status),
                onClick: onHeadColumnClick,
              },
              {
                key: 'createdOn',
                label: intl.formatMessage(messages.reportingFor),
                onClick: onHeadColumnClick,
              },
              {
                key: 'lastSeen',
                label: intl.formatMessage(messages.lastSeen),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(router =>
              <RouterDataTableRow
                key={router.get('id')}
                intl={intl}
                router={router}
                onClick={onRowClick}
                data-router-Id={router.get('id')}
              />
            )}
        </RouterDataTable>
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

export default enhance(RouterList)

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
import { fetchRouters } from '../RouterRedux'
import {
  RouterDataTable,
  RouterDataTableHead,
  RouterDataTableRow,
} from './RouterDataTable'

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

const FILTERS_CONFIG = {
  geography: true,
  state: true,
  lga: true,
  deviceName: true,
  deviceStatus: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'status', 'createdOn', 'lastSeen'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(filtersSanitizer, searchParams => searchParams.get('filters')),
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
      items: state.router.items,
      table: state.router.table,
    }),
    bindActionCreators.bind(null, {
      fetchRouters,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchRouters,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchRouters(
          filtersParams,
          { hasResults: 0, hasConnectivity: 1 },
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
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
      currentTarget: { dataset: { routerId } },
    }) => history.push(`/browse/router/${routerId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters'))
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

export const RouterList = ({
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
}) =>
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.routersTitle)} />
    <NavTitle title={intl.formatMessage(messages.routersTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() &&
        <BrowseEmptyList history={history} location={location} intl={intl} />}
      {!items.currentIdList.isEmpty() &&
        <RouterDataTable
          selectable={false}
          className={cssClasses('RouterDataTable')}
        >
          <RouterDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
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
        </RouterDataTable>}
      {!items.currentIdList.isEmpty() &&
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          className={cssClasses('BrowseTablePaginator')}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />}
    </DataTableCard>
  </div>

export default enhance(RouterList)

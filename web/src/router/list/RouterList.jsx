import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
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
import { fetchRouters, exportRouters } from '../RouterRedux'
import {
  RouterDataTable,
  RouterDataTableHead,
  RouterDataTableRow,
} from './RouterDataTable'
import ExportListButton from '../../globals/components/ExportListButton'

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

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    deviceName: true,
    requiredPermissions: [],
  },
  { deviceStatus: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'status', 'createdOn', 'lastSeen'],
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
  injectIntl,
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    }),
    ({ location }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      return {
        filters: _.fromPairs([...filtersParams.entries()]),
      }
    }
  ),
  connect(
    state => ({
      items: state.router.items,
      table: state.router.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchRouters,
      exportRouters,
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

    onExcelClick: ({
      location,
      exportRouters,
      sortCol,
      sortDir,
      pageAt,
      table,
    }) => formatType => {
      const format = formatType.id
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportRouters(
          filtersParams,
          { hasResults: 0, hasConnectivity: 1 },
          sortCol,
          sortDir,
          pageAt,
          table.get('total') > 0 ? table.get('total') : 1,
          format,
          'routers'
        )
      }
    },
    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { routerId },
      },
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

export const RouterList = ({
  intl,
  history,
  location,
  table,
  items,
  // --- injected by recompose ---
  onExcelClick,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onRowClick,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.routersTitle)} />
    <NavTitle title={intl.formatMessage(messages.routersTitle)} />
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
        onCsvClick={onExcelClick}
        visible={!items.currentIdList.isEmpty()}
        reportName="Routers"
      />

      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <RouterDataTable
          selectable={false}
          className={cssClasses('RouterDataTable')}
        >
          <RouterDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.routerName),
                sortable: true,
              },
              {
                key: 'status',
                label: intl.formatMessage(messages.status),
                sortable: true,
              },
              {
                key: 'createdOn',
                label: intl.formatMessage(messages.reportingFor),
                sortable: true,
              },
              {
                key: 'lastSeen',
                label: intl.formatMessage(messages.lastSeen),
                sortable: true,
              },
            ]}
          />
          <TableBody>
            {items.currentIdList
              .map(id => items.byId.get(id))
              .map(router => (
                <RouterDataTableRow
                  key={router.get('id')}
                  intl={intl}
                  router={router}
                  onClick={onRowClick}
                  data-router-id={router.get('id')}
                />
              ))}
          </TableBody>
        </RouterDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          className={cssClasses('BrowseTablePaginator')}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
  </div>
)

export default enhance(RouterList)

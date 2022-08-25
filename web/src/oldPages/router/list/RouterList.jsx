import flowRight from 'lodash/flowRight'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@mui/material/TableBody'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { fetchRouters, exportRouters } from '../../../store/RouterRedux'
import { RouterDataTable, RouterDataTableHead, RouterDataTableRow } from './RouterDataTable'
import ExportListButton from '../../../oldComponents/ExportListButton'

import styles from './RouterList.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  routersTitle: {
    id: 'pages.RouterList.routersTitle',
    defaultMessage: 'Routers',
  },
  router: {
    id: 'pages.RouterList.router',
    defaultMessage: 'Router',
  },
  approval: {
    id: 'pages.RouterList.approval',
    defaultMessage: 'Approval Status',
  },
  reportingFor: {
    id: 'pages.RouterList.reportingFor',
    defaultMessage: 'Reporting Since',
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
  { deviceApproval: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'approval', 'createdOn', 'lastSeen'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
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
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      return {
        filters: getFilters(filtersParams),
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
    onInitialLoad:
      ({ location, fetchRouters, sortCol, sortDir, pageAt, pageSize }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          fetchRouters(filtersParams, { hasResults: 0, hasConnectivity: 1 }, sortCol, sortDir, pageAt, pageSize)
        }
      },

    onExcelClick:
      ({ location, exportRouters, sortCol, sortDir, pageAt, table }) =>
      formatType => {
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
    onRowClick:
      ({ navigate }) =>
      ({
        currentTarget: {
          dataset: { routerId },
        },
      }) =>
        navigate(`/browse/router/${routerId}`),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(this.props.location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.navigate(
          {
            ...this.props.location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
      const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, this.props.userPermissions)
      this.setState({
        reducedFilters,
      })
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const RouterList = ({
  intl,
  navigate,
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
    <BrowseFilters navigate={navigate} location={location} intl={intl} config={reducedFilters} />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!table.loading} />
      <ExportListButton
        onExcelClick={onExcelClick}
        onCsvClick={onExcelClick}
        visible={!items.currentIdList.isEmpty()}
        reportName="Routers"
      />

      {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
      {!items.currentIdList.isEmpty() && (
        <RouterDataTable className={cssClasses('RouterDataTable')}>
          <RouterDataTableHead
            navigate={navigate}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.router),
                sortable: true,
              },
              {
                key: 'approval',
                label: intl.formatMessage(messages.approval),
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
          navigate={navigate}
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

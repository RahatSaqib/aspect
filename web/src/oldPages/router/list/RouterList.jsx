import React from 'react'
import { TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { Helmet } from 'react-helmet'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import DetailHeader from '../../../components/DetailHeader'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import BrowseFilters from '../../../oldComponents/filter/BrowseFilters'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { fetchRouters, exportRouters } from '../../../store/RouterRedux'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import { RouterDataTable, RouterDataTableHead, RouterDataTableRow } from './RouterDataTable'
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
        const format = formatType
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
  <>
    <DetailHeader name={intl.formatMessage(messages.routersTitle)} disableBack />
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.routersTitle)} />
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
          <BrowseFilters navigate={navigate} location={location} intl={intl} config={reducedFilters} />
          <AspectExportListButton
            data-testid="RouterListExportButton"
            onExport={onExcelClick}
            visible={!items.currentIdList.isEmpty()}
            reportName="Routers"
          />
        </div>
        <DataTableProgressBar disabled={!table.loading} />

        {items.currentIdList.length === 0 ? (
          <BrowseEmptyList navigate={navigate} location={location} />
        ) : (
          <>
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
          </>
        )}
      </DataTableCard>
    </div>
  </>
)

export default enhance(RouterList)

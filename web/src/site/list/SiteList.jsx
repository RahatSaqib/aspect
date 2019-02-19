import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
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
import { fetchSites } from '../SiteRedux'
import {
  SiteDataTable,
  SiteDataTableHead,
  SiteDataTableRow,
} from './SiteDataTable'

const cssClasses = classnames.bind(require('./SiteList.css'))

const messages = defineMessages({
  sitesTitle: {
    id: 'pages.SiteList.title',
    defaultMessage: 'Sites',
  },
  siteName: {
    id: 'pages.SiteList.siteName',
    defaultMessage: 'Name',
  },
  state: {
    id: 'pages.SiteList.state',
    defaultMessage: 'State',
  },
  lga: {
    id: 'pages.SiteList.lga',
    defaultMessage: 'County',
  },
  totalDevices: {
    id: 'pages.SiteList.totalDevices',
    defaultMessage: 'Number of Devices',
  },
  externalId: {
    id: 'pages.SiteList.externalId',
    defaultMessage: 'Facility Code',
  },
  paginatorStatus: {
    id: 'pages.SiteList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# site}
      other {# sites}
    }`,
  },
})

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
  },
  {
    externalId: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'state', 'lga', 'totalDevices'],
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
      items: state.site.items,
      table: state.site.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchSites,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchSites,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchSites(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onRowClick: ({ history }) => ({ currentTarget: { dataset: { siteId } } }) =>
      history.push(`/browse/site/${siteId}`),
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

export const SiteList = ({
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
    <Helmet title={intl.formatMessage(messages.sitesTitle)} />
    <NavTitle title={intl.formatMessage(messages.sitesTitle)} />
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
        <SiteDataTable
          selectable={false}
          className={cssClasses('SiteDataTable')}
        >
          <SiteDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.siteName),
                sortable: true,
              },
              {
                key: 'state',
                label: intl.formatMessage(messages.state),
                sortable: true,
              },
              {
                key: 'lga',
                label: intl.formatMessage(messages.lga),
                sortable: true,
              },
              {
                key: 'totalDevices',
                label: intl.formatMessage(messages.totalDevices),
                sortable: true,
              },
            ]}
          />
          <TableBody>
            {items.currentIdList
              .map(id => items.byId.get(id))
              .map(site => (
                <SiteDataTableRow
                  key={site.get('id')}
                  intl={intl}
                  site={site}
                  onClick={onRowClick}
                  data-site-id={site.get('id')}
                />
              ))}
          </TableBody>
        </SiteDataTable>
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

export default enhance(SiteList)

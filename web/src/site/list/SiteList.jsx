import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'

import { getCustomMessage } from '../../shared/utils/customMessages'
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
import { fetchSites, exportSites } from '../SiteRedux'
import {
  SiteDataTable,
  SiteDataTableHead,
  SiteDataTableRow,
} from './SiteDataTable'
import ExportListButton from '../../globals/components/ExportListButton'

const cssClasses = classnames.bind(require('./SiteList.css'))

export const messages = defineMessages({
  sitesTitle: {
    id: 'pages.SiteList.title',
    defaultMessage: 'Sites',
  },
  siteName: {
    id: 'pages.SiteList.siteName',
    defaultMessage: 'Name',
  },
  totalDevices: {
    id: 'pages.SiteList.totalDevices',
    defaultMessage: 'Number of Devices',
  },
  externalId: {
    id: 'pages.SiteList.externalId',
    defaultMessage: 'Site ID',
  },
  siteIssues: {
    id: 'pages.SiteList.siteIssues',
    defaultMessage: 'Issues',
  },
  state: {
    id: 'pages.SiteList.state',
    defaultMessage: 'State',
  },
  lga: {
    id: 'pages.SiteList.lga',
    defaultMessage: 'County',
  },
  issueCategoryDeviceHealth: {
    id: 'pages.SiteList.issueCategoryDeviceHealth',
    defaultMessage: 'Device',
  },
  issueCategoryReagentHealth: {
    id: 'pages.SiteList.issueCategoryReagentHealth',
    defaultMessage: 'Reagent',
  },
  issueCategoryDataHealth: {
    id: 'pages.SiteList.issueCategoryDataHealth',
    defaultMessage: 'Data',
  },
  issueCategoryConnectivityHealth: {
    id: 'pages.SiteList.issueCategoryConnectivityHealth',
    defaultMessage: 'Connectivity',
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
    state => () => {
      return ({
        items: state.site.items,
        table: state.site.table,
        userPermissions: state.user.jwt.permissions,
        user: state.user,
      })
    },
    bindActionCreators.bind(null, {
      fetchSites,
      exportSites,
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

    onAlertClick: ({ history }) => event => {
      event.stopPropagation()
      const {
        currentTarget: {
          dataset: { siteId },
        },
      } = event
      history.push(`/browse/site/${siteId}/alerts`)
    },

    onExcelClick: ({
      location,
      exportSites,
      sortCol,
      sortDir,
      pageAt,
      table,
    }) => formatType => {
      const format = formatType.id
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportSites(
          filtersParams,
          sortCol,
          sortDir,
          pageAt,
          table.get('total') > 0 ? table.get('total') : 1,
          format,
          'sites'
        )
      }
    },

    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { siteId },
      },
    }) => history.push(`/browse/site/${siteId}`),
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
  onExcelClick,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onRowClick,
  onAlertClick,
  reducedFilters,
  user,
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
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      <ExportListButton
        onExcelClick={onExcelClick}
        onCsvClick={onExcelClick}
        visible={!items.currentIdList.isEmpty()}
        reportName="Sites"
      />

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
                label: getCustomMessage(intl, messages, 'state', user),
                sortable: true,
              },
              {
                key: 'lga',
                label: getCustomMessage(intl, messages, 'lga', user),
                sortable: true,
              },
              {
                key: 'siteId',
                label: intl.formatMessage(messages.externalId),
                sortable: true,
              },
              {
                key: 'totalDevices',
                label: intl.formatMessage(messages.totalDevices),
                sortable: true,
              },
              {
                key: 'siteIssues',
                label: intl.formatMessage(messages.siteIssues),
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
                  onAlertClick={onAlertClick}
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

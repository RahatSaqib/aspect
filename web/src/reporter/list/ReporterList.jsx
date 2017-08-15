import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
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
import { fetchReporters } from '../ReporterRedux'
import {
  ReporterDataTable,
  ReporterDataTableHead,
  ReporterDataTableRow,
} from './ReporterDataTable'

const cssClasses = classnames.bind(require('./ReporterList.css'))

const messages = defineMessages({
  reportersTitle: {
    id: 'pages.ReporterList.reportersTitle',
    defaultMessage: 'Reporters',
  },
  reporterName: {
    id: 'pages.ReporterList.reporterName',
    defaultMessage: 'Reporter Name',
  },
  reporterShortName: {
    id: 'pages.ReporterList.reporterShortName',
    defaultMessage: 'Reporter',
  },
  reporterSite: {
    id: 'pages.ReporterList.siteName',
    defaultMessage: 'Site',
  },
  status: {
    id: 'pages.ReporterList.status',
    defaultMessage: 'Status',
  },
  connectedSince: {
    id: 'pages.ReporterList.connectedSince',
    defaultMessage: 'Connected Since',
  },
  lastSeen: {
    id: 'pages.ReporterList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  numberOfTestsLeft: {
    id: 'pages.ReporterList.numberOfTestsLeft',
    defaultMessage: 'Number Of',
  },
  numberOfTestsRight: {
    id: 'pages.ReporterList.numberOfTestsRight',
    defaultMessage: 'Tests Delivered',
  },
  deliveredLastMonth: {
    id: 'pages.ReporterList.deliveredLastMonth',
    defaultMessage: 'Last Month',
  },
  deliveredThisMonth: {
    id: 'pages.ReporterList.deliveredThisMonth',
    defaultMessage: 'This Month',
  },
  acknowledgedRatio: {
    id: 'pages.ReporterList.acknowledgedRatio',
    defaultMessage: '% Acknowledged',
  },
  flagged: {
    id: 'pages.ReporterList.flagged',
    defaultMessage: 'Flagged',
  },
  paginatorStatus: {
    id: 'pages.ReporterList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# reporter}
      other {# reporters}
    }`,
  },
})

const FILTERS_CONFIG = {
  geography: true,
  state: true,
  lga: true,
  siteName: true,
  deviceName: true,
  deviceStatus: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'siteName',
    'shortname',
    'status',
    'createdOn',
    'lastSeen',
    'deliveredLastMonth',
    'deliveredThisMonth',
    'acknowledgedRatio',
    'totalFlagged',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(filtersSanitizer, searchParams => searchParams.get('filters')),
  searchSanitizer
)

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      items: state.reporter.items,
      table: state.reporter.table,
    }),
    bindActionCreators.bind(null, {
      fetchReporters,
    })
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchReporters,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchReporters(
          filtersParams,
          { hasResults: 0, hasConnectivity: 0 },
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
      currentTarget: { dataset: { reporterId } },
    }) => history.push(`/browse/reporter/${reporterId}`),
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

export const ReporterList = ({
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
    <Helmet
      title={intl.formatMessage(messages.reportersTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.reportersTitle)} />
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
        <ReporterDataTable
          selectable={false}
          className={cssClasses('ReporterDataTable')}
        >
          <ReporterDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'siteName',
                label: intl.formatMessage(messages.reporterSite),
                onClick: onHeadColumnClick,
              },
              {
                key: 'shortname',
                label: intl.formatMessage(messages.reporterShortName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'status',
                label: intl.formatMessage(messages.status),
                onClick: onHeadColumnClick,
              },
              {
                key: 'createdOn',
                label: intl.formatMessage(messages.connectedSince),
                onClick: onHeadColumnClick,
              },
              {
                key: 'lastSeen',
                label: intl.formatMessage(messages.lastSeen),
                onClick: onHeadColumnClick,
              },
              {
                key: 'deliveredLastMonth',
                className: cssClasses('ReporterDataTableHead__Tests--left'),
                onClick: onHeadColumnClick,
                label: (
                  <span>
                    {intl.formatMessage(messages.numberOfTestsLeft)}
                    <br />
                    {intl.formatMessage(messages.deliveredLastMonth)}
                  </span>
                ),
              },
              {
                key: 'deliveredThisMonth',
                className: cssClasses('ReporterDataTableHead__Tests--right'),
                onClick: onHeadColumnClick,
                label: (
                  <span>
                    {intl.formatMessage(messages.numberOfTestsRight)}
                    <br />
                    {intl.formatMessage(messages.deliveredThisMonth)}
                  </span>
                ),
              },
              {
                key: 'acknowledgedRatio',
                label: intl.formatMessage(messages.acknowledgedRatio),
                onClick: onHeadColumnClick,
              },
              {
                key: 'totalFlagged',
                label: intl.formatMessage(messages.flagged),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(reporter =>
              <ReporterDataTableRow
                key={reporter.get('id')}
                intl={intl}
                reporter={reporter}
                onClick={onRowClick}
                data-reporter-Id={reporter.get('id')}
              />
            )}
        </ReporterDataTable>}
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

export default enhance(ReporterList)

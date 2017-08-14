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
import { fetchTerminals } from '../TerminalRedux'
import {
  TerminalDataTable,
  TerminalDataTableHead,
  TerminalDataTableRow,
} from './TerminalDataTable'

const cssClasses = classnames.bind(require('./TerminalList.css'))

const messages = defineMessages({
  terminalsTitle: {
    id: 'pages.TerminalList.terminalsTitle',
    defaultMessage: 'Terminals',
  },
  terminalName: {
    id: 'pages.TerminalList.terminalName',
    defaultMessage: 'Terminal Name',
  },
  terminalShortName: {
    id: 'pages.TerminalList.terminalShortName',
    defaultMessage: 'Terminal',
  },
  terminalSite: {
    id: 'pages.TerminalList.siteName',
    defaultMessage: 'Site',
  },
  status: {
    id: 'pages.TerminalList.status',
    defaultMessage: 'Status',
  },
  connectedSince: {
    id: 'pages.TerminalList.connectedSince',
    defaultMessage: 'Connected Since',
  },
  lastSeen: {
    id: 'pages.TerminalList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  numberOfTestsLeft: {
    id: 'pages.TerminalList.numberOfTestsLeft',
    defaultMessage: 'Number Of',
  },
  numberOfTestsRight: {
    id: 'pages.TerminalList.numberOfTestsRight',
    defaultMessage: 'Tests Delivered',
  },
  deliveredLastMonth: {
    id: 'pages.TerminalList.deliveredLastMonth',
    defaultMessage: 'Last Month',
  },
  deliveredThisMonth: {
    id: 'pages.TerminalList.deliveredThisMonth',
    defaultMessage: 'This Month',
  },
  acknowledgedRatio: {
    id: 'pages.TerminalList.acknowledgedRatio',
    defaultMessage: '% Acknowledged',
  },
  flagged: {
    id: 'pages.TerminalList.flagged',
    defaultMessage: 'Flagged',
  },
  paginatorStatus: {
    id: 'pages.TerminalList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# terminal}
      other {# terminals}
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
      items: state.terminal.items,
      table: state.terminal.table,
    }),
    bindActionCreators.bind(null, {
      fetchTerminals,
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
      fetchTerminals,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchTerminals(
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
      currentTarget: { dataset: { terminalId } },
    }) => history.push(`/browse/terminal/${terminalId}`),
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
      title={intl.formatMessage(messages.terminalsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.terminalsTitle)} />
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
        <TerminalDataTable
          selectable={false}
          className={cssClasses('TerminalDataTable')}
        >
          <TerminalDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'siteName',
                label: intl.formatMessage(messages.terminalSite),
                onClick: onHeadColumnClick,
              },
              {
                key: 'shortname',
                label: intl.formatMessage(messages.terminalShortName),
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
                className: cssClasses('TerminalDataTableHead__Tests--left'),
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
                className: cssClasses('TerminalDataTableHead__Tests--right'),
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
            .map(terminal =>
              <TerminalDataTableRow
                key={terminal.get('id')}
                intl={intl}
                terminal={terminal}
                onClick={onRowClick}
                data-terminal-Id={terminal.get('id')}
              />
            )}
        </TerminalDataTable>}
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

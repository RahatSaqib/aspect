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
import { fetchListFilteredTerminals } from '../TerminalRedux'
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

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.terminal.items,
      table: state.terminal.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredTerminals,
      configureListFilter,
    })
  ),
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredTerminals, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredTerminals(
        { hasResults: 0, hasConnectivity: 0 },
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { terminalId } },
    }) => history.push(`/browse/terminal/${terminalId}`),
    onPageChange: ({ fetchListFilteredTerminals, table }) => nextPage =>
      fetchListFilteredTerminals(
        { hasResults: 0, hasConnectivity: 0 },
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredTerminals, table }) => nextPageSize =>
      fetchListFilteredTerminals(
        { hasResults: 0, hasConnectivity: 0 },
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
        siteName: true,
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

export const TerminalList = ({
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
      title={intl.formatMessage(messages.terminalsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.terminalsTitle)} />
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
        <TerminalDataTable
          selectable={false}
          className={cssClasses('TerminalDataTable')}
        >
          <TerminalDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
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
                className: cssClasses('DeviceDataTableHead__Tests--left'),
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
                className: cssClasses('DeviceDataTableHead__Tests--right'),
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
        </TerminalDataTable>
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

export default enhance(TerminalList)

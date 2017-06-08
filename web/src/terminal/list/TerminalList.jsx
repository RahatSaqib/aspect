import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { fetchListFilteredTerminals } from '../TerminalRedux'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import DataTableWithEmptyList
  from '../../components/shared/DataTableWithEmptyList'
import NavTitle from '../../globals/components/NavTitle'
import styles from './TerminalList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

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
    id: 'pages.DeviceList.numberOfTestsLeft',
    defaultMessage: 'Number Of',
  },
  numberOfTestsRight: {
    id: 'pages.DeviceList.numberOfTestsRight',
    defaultMessage: 'Tests Delivered',
  },
  deliveredLastMonth: {
    id: 'pages.DeviceList.deliveredLastMonth',
    defaultMessage: 'Last Month',
  },
  deliveredThisMonth: {
    id: 'pages.DeviceList.deliveredThisMonth',
    defaultMessage: 'This Month',
  },
  acknowledgedRatio: {
    id: 'pages.DeviceList.acknowledgedRatio',
    defaultMessage: '% Acknowledged',
  },
  flagged: {
    id: 'pages.DeviceList.flagged',
    defaultMessage: 'Flagged',
  },
  filterTemplate: {
    id: 'pages.TerminalList.filterTemplate',
    defaultMessage: 'Viewing all terminals<GEOGRAPHY><NAME><DEVICESTATUS>.',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.terminal.items,
      table: state.terminal.table,
    }),
    dispatch =>
      bindActionCreators(
        {
          fetchListFilteredTerminals,
          configureListFilter,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredTerminals: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  })
)

const TERMINAL_TABLE_COLUMN_SPACING = 12
const TERMINAL_TABLE_SITE_COLUMN_WIDTH = '21%'
const TERMINAL_TABLE_SHORTNAME_COLUMN_WIDTH = '12%'
const TERMINAL_TABLE_STATUS_COLUMN_WIDTH = '10%'

export class TerminalList extends PureComponent {
  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  static childContextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  getChildContext() {
    const { muiTheme } = this.context

    return {
      muiTheme: {
        ...muiTheme,
        tableHeaderColumn: {
          // Overrides the style used by <material-ui/Table/TableHeaderColumn /> in <DataTable />
          ...muiTheme.tableHeaderColumn,
          spacing: TERMINAL_TABLE_COLUMN_SPACING,
        },
        tableRowColumn: {
          // Overrides the style used by <material-ui/Table/TableRowColumn /> in <DataTable />
          ...muiTheme.tableRowColumn,
          spacing: TERMINAL_TABLE_COLUMN_SPACING,
        },
      },
    }
  }

  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({
      geography: true,
      siteName: true,
      deviceName: true,
      deviceStatus: true,
    })
  }

  componentDidMount() {
    this.handleFetch()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleItemIdSelection = terminalId => {
    this.props.history.push(`/browse/terminal/${terminalId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredTerminals(
      { hasResults: 0, hasConnectivity: 0 },
      ...args
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage, formatRelative, formatNumber } = intl
    const columns = [
      {
        db: 'siteName',
        title: formatMessage(messages.terminalSite),
        extraProps: { style: { width: TERMINAL_TABLE_SITE_COLUMN_WIDTH } },
      },
      {
        db: 'shortname',
        title: formatMessage(messages.terminalShortName),
        extraProps: { style: { width: TERMINAL_TABLE_SHORTNAME_COLUMN_WIDTH } },
      },
      {
        db: 'status',
        title: formatMessage(messages.status),
        hideOnXs: true,
        extraProps: { style: { width: TERMINAL_TABLE_STATUS_COLUMN_WIDTH } },
      },
      {
        db: 'createdOn',
        title: formatMessage(messages.connectedSince),
        hideOnXs: true,
        format: data => formatRelative(data),
      },
      {
        db: 'lastSeen',
        title: formatMessage(messages.lastSeen),
        hideOnXs: true,
        format: data => formatRelative(data),
      },
      {
        db: 'deliveredLastMonth',
        extraProps: { style: { paddingRight: 2 } },
        title: (
          <span>
            <span
              style={{
                display: 'inline-block',
                width: '100%',
                textAlign: 'right',
              }}
            >
              {formatMessage(messages.numberOfTestsLeft)}
            </span>
            <br />
            {formatMessage(messages.deliveredLastMonth)}
          </span>
        ),
        format: data => formatNumber(data),
      },
      {
        db: 'deliveredThisMonth',
        extraProps: { style: { paddingLeft: 2 } },
        title: (
          <span>
            <span style={{ display: 'inline-block', textAlign: 'left' }}>
              {formatMessage(messages.numberOfTestsRight)}
            </span>
            <br />
            {formatMessage(messages.deliveredThisMonth)}
          </span>
        ),
        format: data => formatNumber(data),
      },
      {
        db: 'acknowledgedRatio',
        title: formatMessage(messages.acknowledgedRatio),
        format: data => formatNumber(data, { style: 'percent' }),
      },
      {
        db: 'totalFlagged',
        title: formatMessage(messages.flagged),
        format: data => formatNumber(data),
      },
    ]

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.terminalsTitle)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.terminalsTitle)} />
        <ListFilterContainer
          subject={formatMessage(messages.terminalsTitle)}
          filterTemplate={formatMessage(messages.filterTemplate)}
        />
        <DataTableWithEmptyList
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
        />
      </div>
    )
  }
}

export default enhance(TerminalList)

// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
import { withRouter, routerShape } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { fetchListFilteredTerminals } from '../TerminalRedux'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import styles from './TerminalList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'


const messages = defineMessages({
  terminalsTitle: {
    id: 'pages.TerminalList.terminalsTitle',
    defaultMessage: 'Terminals'
  },
  terminalName: {
    id: 'pages.TerminalList.terminalName',
    defaultMessage: 'Terminal Name'
  },
  status: {
    id: 'pages.TerminalList.status',
    defaultMessage: 'Status'
  },
  connectedSince: {
    id: 'pages.TerminalList.connectedSince',
    defaultMessage: 'Connected Since'
  },
  lastSeen: {
    id: 'pages.TerminalList.lastSeen',
    defaultMessage: 'Last Seen'
  },
  numberOfTestsLeft: {
    id: 'pages.DeviceList.numberOfTestsLeft',
    defaultMessage: 'Number Of'
  },
  numberOfTestsRight: {
    id: 'pages.DeviceList.numberOfTestsRight',
    defaultMessage: 'Tests Delivered'
  },
  deliveredLastMonth: {
    id: 'pages.DeviceList.deliveredLastMonth',
    defaultMessage: 'Last Month'
  },
  deliveredThisMonth: {
    id: 'pages.DeviceList.deliveredThisMonth',
    defaultMessage: 'This Month'
  },
  acknowledgedRatio: {
    id: 'pages.DeviceList.acknowledgedRatio',
    defaultMessage: '% Acknowledged'
  },
  flagged: {
    id: 'pages.DeviceList.flagged',
    defaultMessage: 'Flagged'
  },
  filterTemplate: {
    id: 'pages.TerminalList.filterTemplate',
    defaultMessage: 'Viewing all terminals<GEOGRAPHY><NAME><DEVICESTATUS>.'
  }
})

const TERMINAL_TABLE_COLUMN_SPACING = 12
const TERMINAL_TABLE_NAME_COLUMN_WIDTH = '25%'
const TERMINAL_TABLE_STATUS_COLUMN_WIDTH = '10%'

export class TerminalList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    intl: intlShape.isRequired,
    router: routerShape.isRequired,
    fetchListFilteredTerminals: PropTypes.func.isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    configureListFilter: PropTypes.func.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired
  }

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired
  }

  static childContextTypes = {
    muiTheme: PropTypes.object.isRequired
  }

  getChildContext() {
    const { muiTheme } = this.context

    return {
      muiTheme: {
        ...muiTheme,
        tableHeaderColumn: {
          // Overrides the style used by <material-ui/Table/TableHeaderColumn /> in <DataTable />
          ...muiTheme.tableHeaderColumn,
          spacing: TERMINAL_TABLE_COLUMN_SPACING
        },
        tableRowColumn: {
          // Overrides the style used by <material-ui/Table/TableRowColumn /> in <DataTable />
          ...muiTheme.tableRowColumn,
          spacing: TERMINAL_TABLE_COLUMN_SPACING
        }
      }
    }
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl: { formatMessage } } = this.props
    setPageTitle(formatMessage(messages.terminalsTitle))
    configureListFilter({
      geography: true,
      deviceName: true,
      deviceStatus: true
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

  handleItemIdSelection = (terminalId) => {
    this.props.router.push(`/terminal/${terminalId}`)
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
      { db: 'name',
        title: formatMessage(messages.terminalName),
        extraProps: { style: { width: TERMINAL_TABLE_NAME_COLUMN_WIDTH } } },
      { db: 'status',
        title: formatMessage(messages.status),
        hideOnXs: true,
        extraProps: { style: { width: TERMINAL_TABLE_STATUS_COLUMN_WIDTH } } },
      { db: 'createdOn',
        title: formatMessage(messages.connectedSince),
        hideOnXs: true,
        format: data => formatRelative(data) },
      { db: 'lastSeen',
        title: formatMessage(messages.lastSeen),
        hideOnXs: true,
        format: data => formatRelative(data) },
      { db: 'deliveredLastMonth',
        extraProps: { style: { paddingRight: 2 } },
        title: (
          <span>
            <span style={{ display: 'inline-block', width: '100%', textAlign: 'right' }}>
              {formatMessage(messages.numberOfTestsLeft)}
            </span>
            <br />
            {formatMessage(messages.deliveredLastMonth)}
          </span>
        ),
        format: data => formatNumber(data) },
      { db: 'deliveredThisMonth',
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
        format: data => formatNumber(data) },
      { db: 'acknowledgedRatio',
        title: formatMessage(messages.acknowledgedRatio),
        format: data => formatNumber(data, { style: 'percent' }) },
      { db: 'totalFlagged',
        title: formatMessage(messages.flagged),
        format: data => formatNumber(data) }
    ]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.terminalsTitle)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
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

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.terminal.items,
    table: state.terminal.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredTerminals
  }, dispatch)
}

export const TerminalListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TerminalList)

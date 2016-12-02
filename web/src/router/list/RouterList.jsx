// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { withRouter } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { fetchListFilteredDevices } from '../RouterRedux'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import DataTable from '../../components/shared/DataTable'
import styles from './RouterList.css'

const messages = defineMessages({
  routersTitle: {
    id: 'pages.RouterList.routersTitle',
    defaultMessage: 'Routers'
  },
  routerName: {
    id: 'pages.RouterList.routerName',
    defaultMessage: 'Device Name'
  },
  status: {
    id: 'pages.RouterList.status',
    defaultMessage: 'Status'
  },
  reportingFor: {
    id: 'pages.RouterList.reportingFor',
    defaultMessage: 'Reporting For'
  },
  lastSeen: {
    id: 'pages.RouterList.lastSeen',
    defaultMessage: 'Last Seen'
  }
})

const DEVICE_TABLE_COLUMN_SPACING = 12
const DEVICE_TABLE_NAME_COLUMN_WIDTH = '30%'
const DEVICE_TABLE_STATUS_COLUMN_WIDTH = '15%'

export class RouterList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    fetchListFilteredDevices: PropTypes.func.isRequired,
    items: PropTypes.object.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    listFilter: PropTypes.object.isRequired
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
          spacing: DEVICE_TABLE_COLUMN_SPACING
        },
        tableRowColumn: {
          // Overrides the style used by <material-ui/Table/TableRowColumn /> in <DataTable />
          ...muiTheme.tableRowColumn,
          spacing: DEVICE_TABLE_COLUMN_SPACING
        }
      }
    }
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter } = this.props
    setPageTitle(this.getFormattedTitle())
    configureListFilter(this.getDeviceConfigRoute().deviceConfig.filterConfig)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  getDeviceConfigRoute({ routes } = this.props) {
    return _.find(routes, r => r.deviceConfig)
  }

  getFormattedTitle() {
    const { intl } = this.props
    const { formatMessage } = intl
    return formatMessage(messages.routersTitle)
  }

  handleItemIdSelection = (deviceId) => {
    this.props.router.push(`/device/${deviceId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredDevices(
      this.getDeviceConfigRoute().deviceConfig.filterParams,
      ...args
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage, formatRelative } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={this.getFormattedTitle()} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer />
        <DataTable
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={[
            { db: 'name',
              title: formatMessage(messages.routerName),
              extraProps: { style: { width: DEVICE_TABLE_NAME_COLUMN_WIDTH } } },
            { db: 'status',
              title: formatMessage(messages.status),
              hideOnXs: true,
              extraProps: { style: { width: DEVICE_TABLE_STATUS_COLUMN_WIDTH } } },
            { db: 'createdOn',
              title: formatMessage(messages.reportingFor),
              hideOnXs: true,
              format: data => formatRelative(data) },
            { db: 'lastSeen',
              title: formatMessage(messages.lastSeen),
              hideOnXs: true,
              format: data => formatRelative(data) }
          ]}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.device.items,
    table: state.device.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredDevices
  }, dispatch)
}

export const RouterListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(RouterList)

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
import { fetchListFilteredDevices } from '../DeviceRedux'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import DataTable from '../../components/shared/DataTable'
import styles from './DeviceList.css'

const messages = defineMessages({
  devicesTitle: {
    id: 'pages.DeviceList.devicesTitle',
    defaultMessage: 'Devices'
  },
  routersTitle: {
    id: 'pages.DeviceList.routersTitle',
    defaultMessage: 'Routers'
  },
  deviceName: {
    id: 'pages.DeviceList.deviceName',
    defaultMessage: 'Device Name'
  },
  shortName: { // FIXME: unused
    id: 'pages.DeviceList.shortName',
    defaultMessage: 'Short Name'
  },
  status: {
    id: 'pages.DeviceList.status',
    defaultMessage: 'Status'
  },
  reportingFor: {
    id: 'pages.DeviceList.reportingFor',
    defaultMessage: 'Reporting For'
  },
  lastSeen: {
    id: 'pages.DeviceList.lastSeen',
    defaultMessage: 'Last Seen'
  },
  totalTests: {
    id: 'pages.DeviceList.totalTests',
    defaultMessage: 'Total Tests'
  }
})

const DEVICE_TABLE_COLUMN_SPACING = 12
const DEVICE_TABLE_NAME_COLUMN_WIDTH = '30%'
const DEVICE_TABLE_STATUS_COLUMN_WIDTH = '15%'

export class DeviceList extends PureComponent {

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

  componentDidUpdate(prevProps) {
    const prevDeviceConfigRoute = this.getDeviceConfigRoute(prevProps)
    const deviceConfigRoute = this.getDeviceConfigRoute()
    // When switching between routers/devices, re-fetch API
    if (prevDeviceConfigRoute !== deviceConfigRoute) {
      this.props.setPageTitle(this.getFormattedTitle())
    }
  }

  getDeviceConfigRoute({ routes } = this.props) {
    return _.find(routes, r => r.deviceConfig)
  }

  getFormattedTitle() {
    const deviceConfigRoute = this.getDeviceConfigRoute()
    const { intl } = this.props
    const { formatMessage } = intl
    if (deviceConfigRoute.path === 'device') {
      return formatMessage(messages.devicesTitle)
    }
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
    const { formatMessage, formatRelative, formatNumber } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={this.getFormattedTitle()} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer subject={this.getFormattedTitle()} />
        <DataTable
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={[
            { db: 'name',
              title: formatMessage(messages.deviceName),
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
              format: data => formatRelative(data) },
            { db: 'totalTests',
              title: formatMessage(messages.totalTests),
              format: data => formatNumber(data) }
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

export const DeviceListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceList)

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
import {
  fetchListFilteredDevices,
  exportDevices
} from '../DeviceRedux'
import { ListFilterContainer } from '../../filter/list/ListFilter'
import { ListFilter, configureListFilter } from '../../filter/FilterRedux'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import styles from './DeviceList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

const messages = defineMessages({
  devicesTitle: {
    id: 'pages.DeviceList.devicesTitle',
    defaultMessage: 'Devices'
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
  },
  exportExcel: {
    id: 'pages.DeviceList.exportExcel',
    defaultMessage: 'Excel'
  },
  exportCsv: {
    id: 'pages.DeviceList.exportCsv',
    defaultMessage: 'CSV'
  },
  filterTemplate: {
    id: 'pages.DeviceList.filterTemplate',
    defaultMessage: 'Viewing all devices<GEOGRAPHY><NAME>.'
  },
  filterTemplateOptional: {
    id: 'pages.DeviceList.filterTemplateOptional',
    defaultMessage: 'Counting only <ASSAY> assays<RESULT><DATE>.'
  }
})

const DEVICE_TABLE_COLUMN_SPACING = 12
const DEVICE_TABLE_NAME_COLUMN_WIDTH = '30%'
const DEVICE_TABLE_STATUS_COLUMN_WIDTH = '15%'

export class DeviceList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    intl: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    fetchListFilteredDevices: PropTypes.func.isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    configureListFilter: PropTypes.func.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    exportDevices: PropTypes.func.isRequired
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
    const { setPageTitle, configureListFilter, intl: { formatMessage } } = this.props
    setPageTitle(formatMessage(messages.devicesTitle))
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      date: true,
      deviceName: true
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

  handleItemIdSelection = (deviceId) => {
    this.props.router.push(`/device/${deviceId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredDevices(
      { hasResults: 1 },
      ...args
    )
  }

  clickDeviceListExport = (formatType, receivedExportResponse) => {
    this.props.exportDevices(
      { hasResults: 1 },
      formatType,
      this.props.table.sortCol,
      this.props.table.sortDir,
      this.props.table.page,
      this.props.table.pageSize,
      receivedExportResponse
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage, formatRelative, formatNumber } = intl
    const columns = [
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
    ]
    const askConfirmationForExport = this.props.table.total > 1000

    return (
      <div className={styles.Content}>

        <Helmet title={formatMessage(messages.devicesTitle)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer
          subject={formatMessage(messages.devicesTitle)}
          filterTemplate={formatMessage(messages.filterTemplate)}
          filterTemplateOptional={formatMessage(messages.filterTemplateOptional)}

          onClickExport={this.clickDeviceListExport}
          askConfirmationForExport={askConfirmationForExport}
        />

        <DataTableWithEmptyList
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.device.items,
    table: state.device.table,

    listCommand: state.filter.listCommand
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredDevices,

    exportDevices,
  }, dispatch)
}

export const DeviceListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceList)

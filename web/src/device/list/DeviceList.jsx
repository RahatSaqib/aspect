import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { fetchListFilteredDevices, exportDevices } from '../DeviceRedux'
import NavTitle from '../../globals/components/NavTitle'
import { ListFilterContainer } from '../../filter/list/ListFilter'
import { ListFilter, configureListFilter } from '../../filter/FilterRedux'
import DataTableWithEmptyList
  from '../../components/shared/DataTableWithEmptyList'
import styles from './DeviceList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

const messages = defineMessages({
  devicesTitle: {
    id: 'pages.DeviceList.devicesTitle',
    defaultMessage: 'Devices',
  },
  deviceName: {
    id: 'pages.DeviceList.deviceName',
    defaultMessage: 'Device Name',
  },
  state: {
    id: 'pages.DeviceList.state',
    defaultMessage: 'State',
  },
  status: {
    id: 'pages.DeviceList.status',
    defaultMessage: 'Status',
  },
  reportingFor: {
    id: 'pages.DeviceList.reportingFor',
    defaultMessage: 'Reporting For',
  },
  lastSeen: {
    id: 'pages.DeviceList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  numberOfTestsLeft: {
    id: 'pages.DeviceList.numberOfTestsLeft',
    defaultMessage: 'Number',
  },
  numberOfTestsRight: {
    id: 'pages.DeviceList.numberOfTestsRight',
    defaultMessage: 'Of Tests',
  },
  lastMonth: {
    id: 'pages.DeviceList.lastMonth',
    defaultMessage: 'Last Month',
  },
  thisMonth: {
    id: 'pages.DeviceList.thisMonth',
    defaultMessage: 'This Month',
  },
  exportExcel: {
    id: 'pages.DeviceList.exportExcel',
    defaultMessage: 'Excel',
  },
  exportCsv: {
    id: 'pages.DeviceList.exportCsv',
    defaultMessage: 'CSV',
  },
  filterTemplate: {
    id: 'pages.DeviceList.filterTemplate',
    defaultMessage: 'Viewing all devices<GEOGRAPHY><NAME><DEVICESTATUS>.',
  },
  filterTemplateOptional: {
    id: 'pages.DeviceList.filterTemplateOptional',
    defaultMessage: 'Counting only <ASSAY> assays<RESULT><DATE>.',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.device.items,
      table: state.device.table,
    }),
    dispatch =>
      bindActionCreators(
        {
          configureListFilter,
          fetchListFilteredDevices,

          exportDevices,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    configureListFilter: PropTypes.func.isRequired,
    fetchListFilteredDevices: PropTypes.func.isRequired,
    exportDevices: PropTypes.func.isRequired,
  })
)

const DEVICE_TABLE_COLUMN_SPACING = 12
const DEVICE_TABLE_NAME_COLUMN_WIDTH = '30%'
const DEVICE_TABLE_STATUS_COLUMN_WIDTH = '15%'

export class DeviceList extends PureComponent {
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
          spacing: DEVICE_TABLE_COLUMN_SPACING,
        },
        tableRowColumn: {
          // Overrides the style used by <material-ui/Table/TableRowColumn /> in <DataTable />
          ...muiTheme.tableRowColumn,
          spacing: DEVICE_TABLE_COLUMN_SPACING,
        },
      },
    }
  }

  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      siteName: true,
      date: true,
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

  handleItemIdSelection = deviceId => {
    this.props.history.push(`/browse/device/${deviceId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredDevices({ hasResults: 1 }, ...args)
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
      {
        db: 'name',
        title: formatMessage(messages.deviceName),
        extraProps: { style: { width: DEVICE_TABLE_NAME_COLUMN_WIDTH } },
      },
      {
        db: 'state',
        title: formatMessage(messages.state),
      },
      {
        db: 'status',
        title: formatMessage(messages.status),
        hideOnXs: true,
        extraProps: { style: { width: DEVICE_TABLE_STATUS_COLUMN_WIDTH } },
      },
      {
        db: 'createdOn',
        title: formatMessage(messages.reportingFor),
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
        db: 'lastMonth',
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
            {formatMessage(messages.lastMonth)}
          </span>
        ),
        format: data => formatNumber(data),
      },
      {
        db: 'thisMonth',
        extraProps: { style: { paddingLeft: 2 } },
        title: (
          <span>
            <span style={{ display: 'inline-block', textAlign: 'left' }}>
              {formatMessage(messages.numberOfTestsRight)}
            </span>
            <br />
            {formatMessage(messages.thisMonth)}
          </span>
        ),
        format: data => formatNumber(data),
      },
    ]
    const askConfirmationForExport = this.props.table.total > 1000

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.devicesTitle)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.devicesTitle)} />
        <ListFilterContainer
          subject={formatMessage(messages.devicesTitle)}
          filterTemplate={formatMessage(messages.filterTemplate)}
          filterTemplateOptional={formatMessage(
            messages.filterTemplateOptional
          )}
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
          intl={this.props.intl}
        />
      </div>
    )
  }
}

export default enhance(DeviceList)

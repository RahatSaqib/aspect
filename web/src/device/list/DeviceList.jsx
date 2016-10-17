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

// Material-UI
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'

// Our own imports
import { fetchDevices } from '../DeviceRedux'
import { DataTable } from '../../components/shared/DataTable'
import styles from './DeviceList.css'

const messages = defineMessages({
  title: {
    id: 'pages.DeviceList.title',
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
  }
})

const DEVICE_TABLE_COLUMN_SPACING = 12
const DEVICE_TABLE_NAME_COLUMN_WIDTH = '30%'
const DEVICE_TABLE_STATUS_COLUMN_WIDTH = '15%'

export class DeviceList extends PureComponent {

  static propTypes = {
    table: PropTypes.object.isRequired
  }

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired
  }

  static childContextTypes = {
    muiTheme: PropTypes.object.isRequired
  }

  state = {
    filters: this.props.table.get('filters')
  }

  handleItemIdSelection = (deviceId) => {
    this.props.router.push(`/device/${deviceId}`)
  }

  filterDevicesChange = (e) => {
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.fetchDevices(this.state.filters)
  }

  resetDevices = () => {
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.fetchDevices()
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

  render() {
    const { formatMessage, formatRelative, formatNumber } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={styles.Toolbar} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.filterDevicesChange }
                          className={styles['Toolbar__TextField--filter']}
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className={styles.Toolbar__MenuItem} onTouchTap={ this.resetDevices } />
                <MenuItem primaryText="Export to Excel" className={styles.Toolbar__MenuItem} />
                <MenuItem primaryText="Export to CSV" className={styles.Toolbar__MenuItem} />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>
        <DataTable  selectable
                    handleItemIdSelection={this.handleItemIdSelection}
                    handleFetch={ this.props.fetchDevices }
                    items={ this.props.items }
                    table={ this.props.table }
                    columns={[
                      { db: 'name', title: formatMessage(messages.deviceName),
                          extraProps: { style: { width: DEVICE_TABLE_NAME_COLUMN_WIDTH } } },
                      { db: 'status', title: formatMessage(messages.status), hideOnXs: true,
                          extraProps: { style: { width: DEVICE_TABLE_STATUS_COLUMN_WIDTH } } },
                      { db: 'createdOn', title: formatMessage(messages.reportingFor), hideOnXs: true,
                          format: (data) => formatRelative(data) },
                      { db: 'lastSeen', title: formatMessage(messages.lastSeen), hideOnXs: true,
                          format: (data) => formatRelative(data) },
                      { db: 'totalTests', title: formatMessage(messages.totalTests),
                          format: (data) => formatNumber(data) }
                    ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    items: state.device.items,
    table: state.device.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchDevices }, dispatch)
}

export const DeviceListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceList)

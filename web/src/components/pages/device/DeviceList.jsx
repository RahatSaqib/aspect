// Imports from packages
import _ from 'lodash'
import React from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
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
import { fetchDevices } from '../../../action_creators/device_creators'
import { DataTable } from '../../shared/DataTable'
import FormattedNumber from '../../shared/FormattedNumber'
import FormattedDate from '../../shared/FormattedDate'

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
  },
  culture: {
    id: 'pages.DeviceList.culture',
    defaultMessage: 'Culture' // FIXME: missing
  }
})

export class DeviceList extends React.PureComponent {

  state = {
    filters: this.props.table.get('filters')
  }
  filterDevicesChange = this.filterDevicesChange.bind(this)
  handleSubmit = this.handleSubmit.bind(this)
  resetDevices = this.resetDevices.bind(this)

  filterDevicesChange(e){
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit(e){
    e.preventDefault()
    this.props.fetchDevices(this.state.filters)
  }

  resetDevices(){
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.fetchDevices()
  }

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className="content">
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={"toolbar"} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.filterDevicesChange }
                          className="filter-textfield"
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className="linky" onTouchTap={ this.resetDevices } />
                <MenuItem primaryText="Export to Excel" className="linky" />
                <MenuItem primaryText="Export to CSV" className="linky" />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>
        <DataTable  handleFetch={ this.props.fetchDevices }
                    table={ this.props.table }
                    columns={[
                      { db: 'name', title: formatMessage(messages.deviceName) },
                      { db: 'status', title: formatMessage(messages.status), hideOnXs: true },
                      { db: 'createdOn', title: formatMessage(messages.reportingFor), hideOnXs: true,
                          format: (data) => <FormattedDate date={ data } fromNow={true} omitSuffix={true} culture={ formatMessage(messages.culture) } /> },
                      { db: 'lastSeen', title: formatMessage(messages.lastSeen), hideOnXs: true,
                          format: (data) => <FormattedDate date={ data } fromNow={true} culture={ formatMessage(messages.culture) } /> },
                      { db: 'totalTests', title: formatMessage(messages.totalTests),
                          format: (data) => <FormattedNumber number={ data } culture={ formatMessage(messages.culture) } /> }
                    ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    table: state.device.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchDevices }, dispatch)
}

export const DeviceListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceList)

// Imports from packages
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

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
import translate from '../../../i18n/translate'
import FormattedNumber from '../../shared/FormattedNumber'
import FormattedDate from '../../shared/FormattedDate'

export class DeviceList extends React.PureComponent {

  state = {
    filters: this.props.list.get('filters')
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
    return (
      <div className="content">
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
                    list={ this.props.list }
                    columns={[  { db: 'name', title: this.props.strings.deviceName },
                              { db: 'status', title: this.props.strings.status, hideOnXs: true },
                              { db: 'createdOn', title: this.props.strings.reportingFor, hideOnXs: true,
                                format: (data) => <FormattedDate date={ data } fromNow={true} omitSuffix={true} culture={ this.props.strings.culture } /> },
                              { db: 'lastSeen', title: this.props.strings.lastSeen, hideOnXs: true,
                                format: (data) => <FormattedDate date={ data } fromNow={true} culture={ this.props.strings.culture } /> },
                              { db: 'totalTests', title: this.props.strings.totalTests,
                                format: (data) => <FormattedNumber number={ data } culture={ this.props.strings.culture } /> } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    list: state.get('device')
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchDevices }, dispatch)
}

// Translate and connect to redux store
const DeviceListTranslated = translate('DeviceList')(DeviceList)
export const DeviceListContainer = connect(mapStateToProps, mapDispatchToProps)(DeviceListTranslated)

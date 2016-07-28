import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { fetchDevices, resetDevices, filterDevices } from '../../../action_creators/device_creators'

// Material-UI
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'

import { DataTable } from '../../shared/DataTable'
import translate from '../../../i18n/translate'
import FormattedNumber from '../../shared/FormattedNumber'
import FormattedDate from '../../shared/FormattedDate'

export class DeviceList extends React.Component {

  constructor(props) {
    super(props)
    this.state = { filters: props.filters }
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.filterDevicesChange = this.filterDevicesChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.resetDevices = this.resetDevices.bind(this)
  }

  filterDevicesChange(e){
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit(e){
    e.preventDefault()
    this.props.filterDevices(this.state.filters)
  }

  resetDevices(){
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.resetDevices()
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
                  loading={ this.props.loading }
                  items={ this.props.items }
                  sortCol={ this.props.sortCol }
                  sortDir={ this.props.sortDir }
                  page={ this.props.page }
                  size={ this.props.size }
                  total={ this.props.total }
                  filters={ this.props.filters }
                  columns={[  { db: 'name', title: this.props.strings.deviceName },
                              { db: 'status', title: this.props.strings.status, hideOnXs: true },
                              { db: 'createdOn', title: this.props.strings.reportingFor, hideOnXs: true,
                                format: (data) => <FormattedDate date={ data } fromNow={true} omitSuffix={true} /> },
                              { db: 'lastSeen', title: this.props.strings.lastSeen, hideOnXs: true,
                                format: (data) => <FormattedDate date={ data } fromNow={true} /> },
                              { db: 'totalTests', title: this.props.strings.totalTests,
                                format: (data) => <FormattedNumber number={ data } /> } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.getIn(['device', 'loading']),
    items: state.getIn(['device', 'items']),
    sortDir: state.getIn(['device', 'sortDir']),
    sortCol: state.getIn(['device', 'sortCol']),
    page: state.getIn(['device', 'page']),
    size: state.getIn(['device', 'size']),
    total: state.getIn(['device', 'total']),
    filters: state.getIn(['device', 'filters'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchDevices, resetDevices, filterDevices }, dispatch)
}

const DeviceListTranslated = translate('DeviceList')(DeviceList)
export const DeviceListContainer = connect(mapStateToProps, mapDispatchToProps)(DeviceListTranslated)

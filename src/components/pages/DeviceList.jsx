import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { fetchDevices, resetDevices, filterDevices } from '../../action_creators/device_creators'
import { DataTable } from '../shared/DataTable'
import translate from '../../i18n/translate'
import moment from 'moment'

import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'

export class DeviceList extends React.Component {

  constructor(props) {
    super(props)
    this.state = { filters: props.filters }
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.handleFilterChange = this.handleFilterChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleReset = this.handleReset.bind(this)
  }

  handleFilterChange(e){
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit(e){
    e.preventDefault()
    this.props.handleFilter(this.state.filters)
  }

  handleReset(){
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.handleReset()
  }

  render() {

    return (
      <div className="content">

        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={"toolbar"} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.handleFilterChange }
                          className="filter-textfield"
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onClick={ this.handleSubmit } />                         
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" onTouchTap={ this.handleReset } />
                <MenuItem primaryText="Export to Excel" />
                <MenuItem primaryText="Export to CSV" />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>

        <DataTable  handleFetch={ this.props.handleFetch }
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
                                format: (data) => { return moment(data).fromNow(true) } },
                              { db: 'lastSeen', title: this.props.strings.lastSeen, hideOnXs: true,
                                info: 'When did we last hear from the device?',
                                format: (data) => { return moment(data).fromNow() } },
                              { db: 'totalTests', title: this.props.strings.totalTests,
                                format: (data) => { return(data.toLocaleString()) } } ]} />
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
  return {
    handleFetch: (sortCol, sortDir, page, size, filters) => {
      dispatch(fetchDevices(sortCol, sortDir, page, size, filters))
    },
    handleReset: () => {
      dispatch(resetDevices())
    },
    handleFilter: (filters) => {
      dispatch(filterDevices(filters))
    }
  }
}

const DeviceListTranslated = translate('DeviceList')(DeviceList)
export const DeviceListContainer = connect(mapStateToProps, mapDispatchToProps)(DeviceListTranslated)

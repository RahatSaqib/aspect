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
import { fetchSites } from '../../../action_creators/site_creators'
import { DataTable } from '../../shared/DataTable'

const messages = defineMessages({
  title: {
    id: 'pages.SiteList.title',
    defaultMessage: 'Sites'
  },
  siteName: {
    id: 'pages.SiteList.siteName',
    defaultMessage: 'Name'
  },
  state: {
    id: 'pages.SiteList.state',
    defaultMessage: 'State'
  },
  lga: {
    id: 'pages.SiteList.lga',
    defaultMessage: 'County'
  },
  totalDevices: {
    id: 'pages.SiteList.totalDevices',
    defaultMessage: 'Number of Devices'
  }
})

export class SiteList extends React.PureComponent {
  state = {
    filters: this.props.table.get('filters')
  }
  filterSitesChange = this.filterSitesChange.bind(this)
  handleSubmit = this.handleSubmit.bind(this)
  resetSites = this.resetSites.bind(this)

  filterSitesChange(e){
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit(e){
    e.preventDefault()
    this.props.fetchSites(this.state.filters)
  }

  resetSites(){
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.fetchSites()
  }

  render() {
    const { formatMessage } = this.props.intl//

    return (
      <div className="content">
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={"toolbar"} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.filterSitesChange }
                          className="filter-textfield"
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className="linky" onTouchTap={ this.resetSites } />
                <MenuItem primaryText="Export to Excel" className="linky" />
                <MenuItem primaryText="Export to CSV" className="linky" />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>

        <DataTable  handleFetch={ this.props.fetchSites }
                    table={ this.props.table }
                    columns={[{ db: 'name', title: formatMessage(messages.siteName) },
                              { db: 'state', title: formatMessage(messages.state) },
                              { db: 'lga', title: formatMessage(messages.lga) },
                              { db: 'totalDevices', title: formatMessage(messages.totalDevices) } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    table: state.site.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchSites }, dispatch)
}

export const SiteListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(SiteList)

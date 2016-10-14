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
import { DataTable } from '../../components/shared/DataTable'
import { fetchSites } from '../SiteRedux'
import styles from './SiteList.css'

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

export class SiteList extends PureComponent {
  static propTypes = {
    table: PropTypes.object.isRequired
  }

  state = {
    filters: this.props.table.get('filters')
  }

  handleItemIdSelection = (siteId) => {
    this.props.router.push(`/site/${siteId}`)
  }

  filterSitesChange = (e) => {
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.fetchSites(this.state.filters)
  }

  resetSites = () => {
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.fetchSites()
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={styles.Toolbar} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.filterSitesChange }
                          className={styles['Toolbar__TextField--filter']}
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className={styles.Toolbar__MenuItem} onTouchTap={ this.resetSites } />
                <MenuItem primaryText="Export to Excel" className={styles.Toolbar__MenuItem} />
                <MenuItem primaryText="Export to CSV" className={styles.Toolbar__MenuItem} />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>

        <DataTable  selectable
                    handleItemIdSelection={this.handleItemIdSelection}
                    handleFetch={ this.props.fetchSites }
                    items={ this.props.items }
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
    items: state.site.items,
    table: state.site.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchSites }, dispatch)
}

export const SiteListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SiteList)

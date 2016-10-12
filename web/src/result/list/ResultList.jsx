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
import { fetchResults } from '../ResultRedux'
import styles from './ResultList.css'

const messages = defineMessages({
  title: {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results'
  },
  lastTestOn: {
    id: 'pages.ResultList.lastTestOn',
    defaultMessage: 'Test Date'
  },
  deviceName: {
    id: 'pages.ResultList.deviceName',
    defaultMessage: 'Device'
  },
  state: {
    id: 'pages.ResultList.state',
    defaultMessage: 'State'
  },
  lga: {
    id: 'pages.ResultList.lga',
    defaultMessage: 'LGA'
  },
  patiendId: {
    id: 'pages.ResultList.patiendId',
    defaultMessage: 'Patient ID'
  },
  resultText: {
    id: 'pages.ResultList.resultText',
    defaultMessage: 'Result Text'
  }
})

export class ResultList extends PureComponent {

  static propTypes = {
    table: PropTypes.object.isRequired
  }

  state = {
    filters: this.props.table.get('filters')
  }

  handleItemIdSelection = (resultId) => {
    this.props.router.push(`/result/${resultId}`)
  }

  filterResultsChange = (e) => {
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.fetchResults(this.state.filters)
  }

  resetResults = () => {
    this.setState({ filters: this.state.filters.set('deviceName', '') })
    this.props.fetchResults()
  }

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={styles.Toolbar} >
            <ToolbarGroup firstChild={true}>
              <TextField
                value={this.state.filters.get('deviceName')}
                id="deviceName"
                onChange={ this.filterResultsChange }
                className={styles['Toolbar__TextField--filter']}
                hintText="Filter by deviceName"
              />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className={styles.Toolbar__MenuItem} onTouchTap={ this.resetResults } />
                <MenuItem primaryText="Export to Excel" className={styles.Toolbar__MenuItem} />
                <MenuItem primaryText="Export to CSV" className={styles.Toolbar__MenuItem} />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>
        <DataTable
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={ this.props.fetchResults }
          items={ this.props.items }
          table={ this.props.table }
          columns={[
            { db: 'lastTestOn', title: formatMessage(messages.lastTestOn) },
            { db: 'deviceName', title: formatMessage(messages.deviceName) },
            { db: 'state', title: formatMessage(messages.state), hideOnXs: true },
            { db: 'lga', title: formatMessage(messages.lga), hideOnXs: true },
            { db: 'patiendId', title: formatMessage(messages.patiendId) },
            { db: 'resultText', title: formatMessage(messages.resultText) }
          ]}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    items: state.result.items,
    table: state.result.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchResults }, dispatch)
}

export const ResultListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ResultList)

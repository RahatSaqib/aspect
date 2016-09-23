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
import { fetchPersons } from '../../../action_creators/person_creators'
import { DataTable } from '../../shared/DataTable'
import styles from './PersonList.css'

const messages = defineMessages({
  title: {
    id: 'pages.PersonList.title',
    defaultMessage: 'Contacts'
  },
  personName: {
    id: 'pages.PersonList.personName',
    defaultMessage: 'Name'
  },
  level: {
    id: 'pages.PersonList.level',
    defaultMessage: 'Role'
  },
  state: {
    id: 'pages.PersonList.state',
    defaultMessage: 'State'
  },
  lga: {
    id: 'pages.PersonList.lga',
    defaultMessage: 'County'
  }
})

export class PersonList extends React.PureComponent {
  state = {
    filters: this.props.table.get('filters')
  }
  filterPersonsChange = this.filterPersonsChange.bind(this)
  handleSubmit = this.handleSubmit.bind(this)
  resetPersons = this.resetPersons.bind(this)

  filterPersonsChange(e){
    this.setState({ filters: this.state.filters.set(e.target.id, e.target.value) })
  }

  handleSubmit(e){
    e.preventDefault()
    this.props.fetchPersons(this.state.filters)
  }

  resetPersons(){
    this.setState({ filters: this.state.filters.set('name', '') })
    this.props.fetchPersons()
  }

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={styles.Toolbar} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.filterPersonsChange }
                          className={styles['Toolbar__TextField--filter']}
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className={styles.Toolbar__MenuItem} onTouchTap={ this.resetPersons } />
                <MenuItem primaryText="Export to Excel" className={styles.Toolbar__MenuItem} />
                <MenuItem primaryText="Export to CSV" className={styles.Toolbar__MenuItem} />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>

        <DataTable  handleFetch={ this.props.fetchPersons }
                    items={ this.props.items }
                    table={ this.props.table }
                    columns={[  { db: 'name', title: formatMessage(messages.personName) },
                                { db: 'level', title: formatMessage(messages.level), hideOnXs: true },
                                { db: 'state', title: formatMessage(messages.state), hideOnXs: true },
                                { db: 'lga', title: formatMessage(messages.lga), hideOnXs: true } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    items: state.person.items,
    table: state.person.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchPersons }, dispatch)
}

export const PersonListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(PersonList)

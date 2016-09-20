// Imports from packages
import _ from 'lodash'
import React from 'react'
import { injectIntl, defineMessages } from 'react-intl'
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
import { fetchPersons } from '../../../action_creators/person_creators'
import { DataTable } from '../../shared/DataTable'

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

export class PersonEdit extends React.PureComponent {
  state = {
    person: this.props.table.get('filters')
  }
  handleSubmit = this.handleSubmit.bind(this)
  resetPersons = this.resetPersons.bind(this)

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
      <div className="content">
        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={"toolbar"} >
            <ToolbarGroup firstChild={true}>
              <TextField  value={this.state.filters.get('name')}
                          id="name"
                          onChange={ this.filterPersonsChange }
                          className="filter-textfield"
                          hintText="Filter by name" />
              <RaisedButton label="Filter" primary={true} onTouchTap={ this.handleSubmit } />
            </ToolbarGroup>
            <ToolbarGroup lastChild={true}>
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Clear Filters" className="linky" onTouchTap={ this.resetPersons } />
                <MenuItem primaryText="Export to Excel" className="linky" />
                <MenuItem primaryText="Export to CSV" className="linky" />
              </IconMenu>
            </ToolbarGroup>
          </Toolbar>
        </form>

        <DataTable  handleFetch={ this.props.fetchPersons }
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

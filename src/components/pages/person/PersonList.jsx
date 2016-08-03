import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'

// Material-UI
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'

import { fetchPersons } from '../../../action_creators/person_creators'
import { DataTable } from '../../shared/DataTable'
import translate from '../../../i18n/translate'

export class PersonList extends React.Component {

  constructor(props) {
    super(props)
    this.state = { filters: props.list.get('filters') }
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.filterPersonsChange = this.filterPersonsChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.resetPersons = this.resetPersons.bind(this)
  }

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
                    list={ this.props.list }
                    columns={[  { db: 'name', title: this.props.strings.personName },
                                { db: 'level', title: this.props.strings.level, hideOnXs: true },
                                { db: 'state', title: this.props.strings.state, hideOnXs: true },
                                { db: 'lga', title: this.props.strings.lga, hideOnXs: true } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    list: state.get('person')
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchPersons }, dispatch)
}

const PersonListTranslated = translate('PersonList')(PersonList)
export const PersonListContainer = connect(mapStateToProps, mapDispatchToProps)(PersonListTranslated)

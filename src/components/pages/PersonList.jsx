import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { fetchPersons, resetPersons, filterPersons } from '../../action_creators/person_creators'
import { DataTable } from '../shared/DataTable'
import translate from '../../i18n/translate'

import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more'
import RaisedButton from 'material-ui/RaisedButton'
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar'
import MenuItem from 'material-ui/MenuItem'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import TextField from 'material-ui/TextField'

export class PersonList extends React.Component {

  constructor(props) {
    super(props)
    this.state = { filters: props.filters.toObject() }
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.handleFilterChange = this.handleFilterChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleFilterChange(e){
    let filters = this.state.filters
    filters[e.target.id] = e.target.value
    this.setState(filters)
  }

  handleSubmit(e){
    e.preventDefault()
    this.props.handleFilter(this.state.filters)
  }

  render() {
    return (
      <div className="content">
        <h1 className="content-h1">{ this.props.strings.title }</h1>

        <form onSubmit={ this.handleSubmit }>
          <Toolbar className={"toolbar"} >
            <ToolbarGroup firstChild={true}>
              <TextField value={this.state.filters.name} id="name" onChange={ this.handleFilterChange } style={{ margin: '5px 0 0 15px', width: '150px' }} hintText="Filter by name" />
            </ToolbarGroup>
            <ToolbarGroup>
              <RaisedButton label="Filter" primary={true} />
              <IconMenu iconButtonElement={
                  <IconButton touch={true}>
                    <NavigationExpandMoreIcon />
                  </IconButton>}>
                <MenuItem primaryText="Reset" onTouchTap={ () => { this.setState({filters: { name: '' }}); this.props.handleReset() }} />
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
    loading: state.getIn(['person', 'loading']),
    items: state.getIn(['person', 'items']),
    sortDir: state.getIn(['person', 'sortDir']),
    sortCol: state.getIn(['person', 'sortCol']),
    page: state.getIn(['person', 'page']),
    size: state.getIn(['person', 'size']),
    total: state.getIn(['person', 'total']),
    filters: state.getIn(['person', 'filters'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleFetch: (sortCol, sortDir, page, size, filters) => {
      dispatch(fetchPersons(sortCol, sortDir, page, size, filters))
    },
    handleReset: () => {
      dispatch(resetPersons())
    },
    handleFilter: (filters) => {
      dispatch(filterPersons(filters))
    }
  }
}

const PersonListTranslated = translate('PersonList')(PersonList)
export const PersonListContainer = connect(mapStateToProps, mapDispatchToProps)(PersonListTranslated)

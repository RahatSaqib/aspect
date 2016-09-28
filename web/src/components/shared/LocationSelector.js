import React, {PropTypes} from 'react'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchCountriesForSelectLists } from '../../action_creators/country_creators'
import SelectInput from './SelectInput'
import LinearProgress from 'material-ui/LinearProgress'

class LocationSelector extends React.PureComponent {
  static propTypes = {
    fetchCountriesForSelectLists: PropTypes.func.isRequired,
    countriesForSelectLists: PropTypes.object.isRequired,
    countryIdFieldName: PropTypes.string.isRequired,
    stateIdFieldName: PropTypes.string.isRequired,
    lgaIdFieldName: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  }

  constructor(props) {
    super(props)

    this.state = {
      countries: [],
      states: [],
      lgas: [],
      loading: false
    }
    this.onCountryChanged = this.onCountryChanged.bind(this)
    this.onStateChanged = this.onStateChanged.bind(this)
  }

  componentDidMount() {
    this.props.fetchCountriesForSelectLists(false, this.props.countriesForSelectLists.get('lastRefreshed'))
    let countriesFetched = this.props.countriesForSelectLists.get('countries').toJS(),
      countriesLoading = this.props.countriesForSelectLists.get('loading'),
      newState = {}
    if(!_.isEqual(countriesFetched, this.state.countries)) {
      newState.countries = countriesFetched
    }
    if(countriesLoading != this.state.loading) {
      newState.loading = countriesLoading
    }
    if(!_.isEmpty(newState)) {
      this.setState(newState)
    }
  }

  onCountryChanged(event, index, value) {
    let countrySelected = _.find(this.state.countries, {id: value})
    if(countrySelected) {
      this.setState({
        states: countrySelected.states,
        lgas: _.orderBy(_.flatten(_.reduce(countrySelected.states, (result, state) => {
          result.push(_.map(state.lgas, lga => {
            return { id: lga.id, name: lga.name + ', ' + state.name }
          }))
          return result
        }, [])), 'name', 'asc')
      })
    }
  }

  onStateChanged(event, index, value) {
    let stateSelected = _.find(this.state.states, {id: value})
    if(stateSelected) {
      this.setState({
        lgas: stateSelected.lgas
      })
    }
  }

  render() {
    const {disabled, countryIdFieldName, stateIdFieldName, lgaIdFieldName} = this.props
    const selectListDataSourceMappings = { text: 'name', value: 'id' }

    return (
      <div>
        {this.state.loading && <LinearProgress />}
        <SelectInput name={countryIdFieldName} label="Country"
                     disabled={disabled || this.state.loading || !this.state.countries.length}
                     dataSource={this.state.countries} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onCountryChanged} />
        <SelectInput name={stateIdFieldName} label="State"
                     disabled={disabled || this.state.loading || !this.state.states.length}
                     dataSource={this.state.states} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onStateChanged} />
        <SelectInput name={lgaIdFieldName} label="Area"
                     disabled={disabled || this.state.loading || !this.state.lgas.length}
                     dataSource={this.state.lgas} dataSourceConfig={selectListDataSourceMappings} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    countriesForSelectLists: state.countriesForSelectLists
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchCountriesForSelectLists
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LocationSelector)

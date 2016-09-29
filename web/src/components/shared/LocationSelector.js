import React, {PropTypes} from 'react'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchCountriesForSelectLists } from '../../action_creators/country_creators'
import SelectInput from './SelectInput'

class LocationSelector extends React.PureComponent {
  static propTypes = {
    fetchCountriesForSelectLists: PropTypes.func.isRequired,
    countriesForSelectLists: PropTypes.object.isRequired,
    countryIdFieldName: PropTypes.string.isRequired,
    stateIdFieldName: PropTypes.string.isRequired,
    lgaIdFieldName: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    initialCountryId: PropTypes.number,
    initialStateId: PropTypes.number
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      countries: [],
      selectedCountry: null,
      selectedState: null,
      loading: false
    }
    this.initialiseCountriesAndSelections = this.initialiseCountriesAndSelections.bind(this)
    this.onCountryChanged = this.onCountryChanged.bind(this)
    this.selectCountry = this.selectCountry.bind(this)
    this.onStateChanged = this.onStateChanged.bind(this)
    this.selectState = this.selectState.bind(this)
    this.getLgasForCountry = this.getLgasForCountry.bind(this)
  }

  componentDidMount() {
    const {fetchCountriesForSelectLists, countriesForSelectLists} = this.props
    fetchCountriesForSelectLists(false, countriesForSelectLists.get('lastRefreshed'))
    this.initialiseCountriesAndSelections(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.initialiseCountriesAndSelections(nextProps)
  }

  initialiseCountriesAndSelections(props) {
    const {countriesForSelectLists, initialCountryId, initialStateId} = props
    const countriesFetched = countriesForSelectLists.get('countries').toJS(),
      countriesLoading = countriesForSelectLists.get('loading')
    if(countriesLoading != this.state.loading) {
      this.setState({
        loading: countriesLoading
      })
    }
    if(!_.isEqual(countriesFetched, this.state.countries)) {
      this.setState({
        countries: countriesFetched
      })
    }
    if(initialCountryId && !this.state.selectedCountry && !_.isEmpty(countriesFetched)) {
      const initialCountry = _.find(countriesFetched, {id: initialCountryId})
      this.selectCountry(initialCountry)
      if(initialStateId && !this.state.selectedState) {
        const initialState = _.find(initialCountry.states, {id: initialStateId})
        this.selectState(initialState)
      }
    }
  }

  onCountryChanged(event, index, value) {
    const selectedCountry = _.find(this.state.countries, {id: value})
    this.selectCountry(selectedCountry)
  }

  selectCountry(country) {
    if(!_.isEqual(country, this.state.selectedCountry)) {
      this.setState({
        selectedCountry: country
      })
      this.selectState(null)
    }
  }

  onStateChanged(event, index, value) {
    if(this.state.selectedCountry) {
      const selectedState = _.find(this.state.selectedCountry.states, {id: value})
      this.selectState(selectedState)
    }
  }

  selectState(state) {
    if(!_.isEqual(state, this.state.selectedState)) {
      this.setState({
        selectedState: state
      })
    }
  }

  getLgasForCountry(country) {
    return _.orderBy(_.flatten(_.reduce(country.states, (result, state) => {
      result.push(_.map(state.lgas, lga => {
        return { id: lga.id, name: lga.name + ', ' + state.name }
      }))
      return result
    }, [])), 'name', 'asc')
  }

  render() {
    const {disabled, countryIdFieldName, stateIdFieldName, lgaIdFieldName} = this.props
    const selectListDataSourceMappings = { text: 'name', value: 'id' }

    const {loading, countries, selectedCountry, selectedState} = this.state,
      states = selectedCountry ? selectedCountry.states : [],
      lgas = selectedState ? selectedState.lgas :
        (selectedCountry ? this.getLgasForCountry(selectedCountry) : [])

    return (
      <div>
        <SelectInput name={countryIdFieldName} label="Country"
                     disabled={disabled || loading || !countries.length} dataSource={countries}
                     dataSourceConfig={selectListDataSourceMappings} onChange={this.onCountryChanged} />
        <SelectInput name={stateIdFieldName} label="State"
                     disabled={disabled || loading || !states.length} dataSource={states}
                     dataSourceConfig={selectListDataSourceMappings} onChange={this.onStateChanged} />
        <SelectInput name={lgaIdFieldName} label="Area"
                     disabled={disabled || loading || !lgas.length} dataSource={lgas}
                     dataSourceConfig={selectListDataSourceMappings} onChange={this.onLgaChanged} />
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

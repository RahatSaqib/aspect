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
    initialValues: PropTypes.object
  }

  constructor(props) {
    super(props)
    this.state = {
      selectedCountry: null,
      selectedState: null
    }

    this.initialiseCountriesAndSelections = this.initialiseCountriesAndSelections.bind(this)
    this.onCountryChanged = this.onCountryChanged.bind(this)
    this.selectCountry = this.selectCountry.bind(this)
    this.onStateChanged = this.onStateChanged.bind(this)
    this.selectState = this.selectState.bind(this)
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
    const {countriesForSelectLists, countryIdFieldName, stateIdFieldName, initialValues} = props
    if(initialValues && initialValues[countryIdFieldName] && !this.state.selectedCountry && !_.isEmpty(countriesForSelectLists.get('countries'))) {
      const initialCountry = _.find(countriesForSelectLists.get('countries'), {id: initialValues[countryIdFieldName]})
      this.selectCountry(initialCountry)
      if(initialCountry && initialValues && initialValues[stateIdFieldName] && !this.state.selectedState) {
        const initialState = _.find(initialCountry.states, {id: initialValues[stateIdFieldName]})
        this.selectState(initialState)
      }
    }
  }

  onCountryChanged(event, index, value) {
    const {countriesForSelectLists} = this.props
    const selectedCountry = _.find(countriesForSelectLists.get('countries').toJS(), {id: value})
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

  render() {
    const {disabled, countryIdFieldName, stateIdFieldName, lgaIdFieldName, countriesForSelectLists, initialValues} = this.props,
      countries = countriesForSelectLists.get('countries').toJS()
    let {selectedCountry, selectedState} = this.state
    if(!selectedCountry && initialValues && initialValues[countryIdFieldName] && !_.isEmpty(countries)) {
      selectedCountry = _.find(countries, {id: initialValues[countryIdFieldName]})
    }
    if(!selectedState && initialValues && initialValues[stateIdFieldName] && selectedCountry) {
      selectedState = _.find(selectedCountry.states, {id: initialValues[stateIdFieldName]})
    }
    const selectListDataSourceMappings = { text: 'name', value: 'id' }

    return (
      <div>
        <SelectInput name={countryIdFieldName} label="Country"
                     disabled={disabled || countriesForSelectLists.get('loading') || !countriesForSelectLists.get('countries').size}
                     dataSource={countries} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onCountryChanged} />
        <SelectInput name={stateIdFieldName} label="State"
                     disabled={disabled || countriesForSelectLists.get('loading') || !selectedCountry || _.isEmpty(selectedCountry.states)}
                     dataSource={selectedCountry ? selectedCountry.states : []} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onStateChanged} />
        <SelectInput name={lgaIdFieldName} label="Area"
                     disabled={disabled || countriesForSelectLists.get('loading') || !selectedState || _.isEmpty(selectedState.lgas)}
                     dataSource={selectedState ? selectedState.lgas : []} dataSourceConfig={selectListDataSourceMappings} />
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

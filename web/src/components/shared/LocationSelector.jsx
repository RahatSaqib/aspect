import React, {PropTypes} from 'react'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchCountriesForLocationSelector } from '../../action_creators/geography_creators'
import SelectInput from './SelectInput'

const messages = defineMessages({
  country: {
    id: 'pages.LocationSelector.country',
    defaultMessage: 'Country'
  },
  state: {
    id: 'pages.LocationSelector.state',
    defaultMessage: 'State'
  },
  lga: {
    id: 'pages.LocationSelector.lga',
    defaultMessage: 'Area'
  }
})

class LocationSelector extends React.PureComponent {
  static propTypes = {
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    countriesForLocationSelector: PropTypes.object.isRequired,
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
    const {fetchCountriesForLocationSelector, countriesForLocationSelector, initialValues, countryIdFieldName, stateIdFieldName} = this.props
    fetchCountriesForLocationSelector(initialValues[countryIdFieldName], initialValues[stateIdFieldName], false, countriesForLocationSelector.get('lastRefreshed'))
    this.initialiseCountriesAndSelections(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.initialiseCountriesAndSelections(nextProps)
  }

  initialiseCountriesAndSelections(props) {
    const {countriesForLocationSelector, countryIdFieldName, stateIdFieldName, initialValues} = props
    if(initialValues && initialValues[countryIdFieldName] && !this.state.selectedCountry && !_.isEmpty(countriesForLocationSelector.get('countries'))) {
      const initialCountry = _.find(countriesForLocationSelector.get('countries'), {id: initialValues[countryIdFieldName]})
      this.selectCountry(initialCountry)
      if(initialCountry && initialValues && initialValues[stateIdFieldName] && !this.state.selectedState) {
        const initialState = _.find(initialCountry.states, {id: initialValues[stateIdFieldName]})
        this.selectState(initialState)
      }
    }
  }

  onCountryChanged(event, index, value) {
    const {countriesForLocationSelector} = this.props
    const selectedCountry = _.find(countriesForLocationSelector.get('countries').toJS(), {id: value})
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
    const { formatMessage } = this.props.intl
    const {disabled, countryIdFieldName, stateIdFieldName, lgaIdFieldName, countriesForLocationSelector, initialValues} = this.props,
      countries = countriesForLocationSelector.get('countries').toJS()
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
        <SelectInput name={countryIdFieldName} label={formatMessage(messages.country)}
                     disabled={disabled || countriesForLocationSelector.get('loading') || !countriesForLocationSelector.get('countries').size}
                     dataSource={countries} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onCountryChanged} />
        <SelectInput name={stateIdFieldName} label={formatMessage(messages.state)}
                     disabled={disabled || countriesForLocationSelector.get('loading') || !selectedCountry || _.isEmpty(selectedCountry.states)}
                     dataSource={selectedCountry ? selectedCountry.states : []} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onStateChanged} />
        <SelectInput name={lgaIdFieldName} label={formatMessage(messages.lga)}
                     disabled={disabled || countriesForLocationSelector.get('loading') || !selectedState || _.isEmpty(selectedState.lgas)}
                     dataSource={selectedState ? selectedState.lgas : []} dataSourceConfig={selectListDataSourceMappings} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    countriesForLocationSelector: state.countriesForLocationSelector
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchCountriesForLocationSelector
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(LocationSelector)

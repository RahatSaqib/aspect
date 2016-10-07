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
    const {fetchCountriesForLocationSelector, countriesForLocationSelector, initialValues,
      countryIdFieldName, stateIdFieldName} = this.props
    fetchCountriesForLocationSelector(false, countriesForLocationSelector,
      initialValues[countryIdFieldName], initialValues[stateIdFieldName])
    this.initialiseCountriesAndSelections(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.initialiseCountriesAndSelections(nextProps)
  }

  initialiseCountriesAndSelections(props) {
    const {countriesForLocationSelector, countryIdFieldName, stateIdFieldName, initialValues} = props
    if(initialValues && initialValues[countryIdFieldName] && !this.state.selectedCountry &&
      countriesForLocationSelector.get('items') && countriesForLocationSelector.get('items').size) {
      const initialCountry = countriesForLocationSelector.get('items').find(country =>
        country.id === initialValues[countryIdFieldName])
      this.selectCountry(initialCountry)
      if(initialCountry && initialCountry.children.items && initialCountry.children.items.size &&
        initialValues && initialValues[stateIdFieldName] && !this.state.selectedState) {
        const initialState = initialCountry.children.items.find(
          state => state.id === initialValues[stateIdFieldName])
        this.selectState(initialState)
      }
    }
  }

  onCountryChanged(event, index, value) {
    const {countriesForLocationSelector} = this.props
    const selectedCountry = countriesForLocationSelector.get('items').find(country => country.id === value)
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
    if(this.state.selectedCountry && this.state.selectedCountry.children.items &&
      this.state.selectedCountry.children.items.size) {
      const selectedState = this.state.selectedCountry.children.items.find(state => state.id === value)
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
    const {disabled, countryIdFieldName, stateIdFieldName, lgaIdFieldName,
        countriesForLocationSelector, initialValues} = this.props,
      countries = countriesForLocationSelector.get('items')
    let {selectedCountry, selectedState} = this.state
    if(!selectedCountry && initialValues && initialValues[countryIdFieldName] && countries &&
      countries.size) {
      selectedCountry = countries.find(country => country.id === initialValues[countryIdFieldName])
    }
    if(!selectedState && initialValues && initialValues[stateIdFieldName] && selectedCountry &&
      selectedCountry.children.items && selectedCountry.children.items.size) {
      selectedState = selectedCountry.children.items.find(
        state => state.id === initialValues[stateIdFieldName])
    }
    const selectListDataSourceMappings = { text: 'name', value: 'id' }

    return (
      <div>
        <SelectInput name={countryIdFieldName} label={formatMessage(messages.country)}
                     disabled={disabled || countriesForLocationSelector.get('loading') || !countriesForLocationSelector.get('items').size}
                     dataSource={countries} dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onCountryChanged} />
        <SelectInput name={stateIdFieldName} label={formatMessage(messages.state)}
                     disabled={disabled || countriesForLocationSelector.get('loading') ||
                       !selectedCountry || selectedCountry.children.loading ||
                       !selectedCountry.children.items || !selectedCountry.children.items.size}
                     dataSource={selectedCountry ? (selectedCountry.children.items || []) : []}
                     dataSourceConfig={selectListDataSourceMappings}
                     onChange={this.onStateChanged} />
        <SelectInput name={lgaIdFieldName} label={formatMessage(messages.lga)}
                     disabled={disabled || countriesForLocationSelector.get('loading') ||
                       !selectedState || selectedState.children.loading ||
                       !selectedState.children.items || !selectedState.children.items.size}
                     dataSource={selectedState ? (selectedState.children.items || []) : []}
                     dataSourceConfig={selectListDataSourceMappings} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    countriesForLocationSelector: state.geography.countriesForLocationSelector
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

import React, {PropTypes} from 'react'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchCountriesForLocationSelector, fetchStatesForLocationSelector, fetchLgasForLocationSelector } from '../../action_creators/geography_creators'
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
    fetchStatesForLocationSelector: PropTypes.func.isRequired,
    fetchLgasForLocationSelector: PropTypes.func.isRequired,
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
      initialValues.get(countryIdFieldName), initialValues.get(stateIdFieldName))
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
      if(initialCountry && initialCountry.getIn(['children', 'items']) && initialCountry.getIn(['children', 'items']).size &&
        initialValues && initialValues[stateIdFieldName] && !this.state.selectedState) {
        const initialState = initialCountry.getIn(['children', 'items']).find(
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

      this.props.fetchStatesForLocationSelector(false, country)
      this.selectState(null)
    }
  }

  onStateChanged(event, index, value) {
    if(this.state.selectedCountry && this.state.selectedCountry.getIn(['children', 'items']) &&
      this.state.selectedCountry.getIn(['children', 'items']).size) {
      const selectedState = this.state.selectedCountry.getIn(['children', 'items']).find(state => state.id === value)
      this.selectState(selectedState)
    }
  }

  selectState(state) {
    if(!_.isEqual(state, this.state.selectedState)) {
      this.setState({
        selectedState: state
      })
      this.props.fetchLgasForLocationSelector(false, this.state.selectedCountry, state)
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
      selectedCountry.getIn(['children', 'items']) && selectedCountry.getIn(['children', 'items']).size) {
      selectedState = selectedCountry.getIn(['children', 'items']).find(
        state => state.id === initialValues[stateIdFieldName])
    }
    const selectListDataSourceMappings = { text: 'name', value: 'id' },
      countriesForSelectList = countries.toJS(),
      countriesLoading = countries.get('loading'),
      statesForSelectList = selectedCountry && selectedCountry.getIn(['children', 'items']) && selectedCountry.getIn(['children', 'items']).size > 0 ? selectedCountry.getIn(['children', 'items']).toJS() : [],
      statesLoading = selectedCountry ? countriesLoading || selectedCountry.getIn(['children', 'loading']) : false,
      lgasForSelectList = selectedState && selectedState.getIn(['children', 'items']) && selectedState.getIn(['children', 'items']).size > 0 ? selectedState.getIn(['children', 'items']).toJS() : [],
      lgasLoading = selectedState ? statesLoading || selectedState.getIn(['children', 'loading']) : false

    return (
      <div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={countryIdFieldName} label={formatMessage(messages.country)}
                       disabled={disabled || countriesLoading || !countriesForSelectList.length}
                       dataSource={countriesForSelectList} dataSourceConfig={selectListDataSourceMappings}
                       onChange={this.onCountryChanged} />
          {countriesLoading && <span style={{position: 'absolute', left: '0.1em', bottom: '0.5em'}}>Loading...</span>}
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={stateIdFieldName} label={formatMessage(messages.state)}
                       disabled={disabled || statesLoading || !statesForSelectList.length}
                       dataSource={statesForSelectList} dataSourceConfig={selectListDataSourceMappings}
                       onChange={this.onStateChanged} />
          {statesLoading && <span style={{position: 'absolute', left: '0.1em', bottom: '0.5em'}}>Loading...</span>}
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={lgaIdFieldName} label={formatMessage(messages.lga)}
                       disabled={disabled || lgasLoading || !lgasForSelectList.length}
                       dataSource={lgasForSelectList} dataSourceConfig={selectListDataSourceMappings} />
          {lgasLoading && <span style={{position: 'absolute', left: '0.1em', bottom: '0.5em'}}>Loading...</span>}
        </div>
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
    fetchCountriesForLocationSelector,
    fetchStatesForLocationSelector,
    fetchLgasForLocationSelector
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(LocationSelector)

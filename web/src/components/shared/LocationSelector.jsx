import React from 'react'
import LinearProgress from 'material-ui/LinearProgress'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {change as changeFieldValue } from 'redux-form'
import {
  fetchCountriesForLocationSelector,
  fetchStatesForLocationSelector,
  fetchLgasForLocationSelector
} from '../../geography/GeographyRedux'
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
  componentWillReceiveProps(nextProps) {
    const {fetchCountriesForLocationSelector, countries, loading,
      selectedCountryId, selectedStateId} = nextProps
    if(!loading) {
      fetchCountriesForLocationSelector(false, countries, selectedCountryId, selectedStateId)
    }
  }

  findCountry = countryId => {
    const {countries} = this.props
    if(countryId && countries && countries.get('items')) {
      return countries.get('items').find(country => country.get('id') === countryId)
    }
  }

  findState = (countryId, stateId) => {
    const country = this.findCountry(countryId)
    if(country && country.getIn(['children', 'items'])) {
      return country.getIn(['children', 'items']).find(state => state.get('id') === stateId)
    }
  }

  onCountryChanged = (event, index, value) => {
    this.selectCountry(value)
  }

  selectCountry = countryId => {
    if(countryId) {
      const {fetchStatesForLocationSelector, changeFieldValue,
        formName, stateIdFieldName, lgaIdFieldName} = this.props
      changeFieldValue(formName, stateIdFieldName, null)
      changeFieldValue(formName, lgaIdFieldName, null)
      fetchStatesForLocationSelector(false, this.findCountry(countryId))
    }
  }

  onStateChanged = (event, index, value) => {
    this.selectState(value)
  }

  selectState = stateId => {
    if(stateId) {
      const {fetchLgasForLocationSelector, changeFieldValue,
        formName, lgaIdFieldName, selectedCountryId} = this.props
      changeFieldValue(formName, lgaIdFieldName, null)
      if(selectedCountryId) {
        fetchLgasForLocationSelector(false, this.findCountry(selectedCountryId),
          this.findState(selectedCountryId, stateId))
      }
    }
  }

  render() {
    const { intl: { formatMessage }, loading, countries,
      countryIdFieldName, stateIdFieldName, lgaIdFieldName,
      selectedCountryId, selectedStateId } = this.props

    const dataSourceConfig = { text: 'name', value: 'id' }
    const dropdownCountries = countries ? countries.get('items').toJS() : []
    const countriesLoading = loading || (_.isEmpty(countries) ? true : countries.get('loading'))
    const selectedCountry = selectedCountryId ? this.findCountry(selectedCountryId) : undefined
    const states = selectedCountry ? selectedCountry.getIn(['children', 'items']) : undefined
    const statesLoading = selectedCountry ? selectedCountry.getIn(['children', 'loading']) : false
    const dropdownStates = states ? states.toJS() : []
    const selectedState = selectedCountryId && selectedStateId ? this.findState(selectedCountryId, selectedStateId) : undefined
    const lgas = selectedState ? selectedState.getIn(['children', 'items']) : undefined
    const lgasLoading = selectedState ? selectedState.getIn(['children', 'loading']) : false
    const dropdownLgas = lgas ? lgas.toJS() : []
    const loadingProgressStyle = {position: 'absolute', bottom: '0.5em', width: '85%'}

    return (
      <div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={countryIdFieldName} label={formatMessage(messages.country)}
                       disabled={loading || countriesLoading || _.isEmpty(dropdownCountries)}
                       dataSource={dropdownCountries} dataSourceConfig={dataSourceConfig}
                       onChange={this.onCountryChanged} />
          {countriesLoading && <LinearProgress style={loadingProgressStyle} />}
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={stateIdFieldName} label={formatMessage(messages.state)}
                       disabled={loading || statesLoading || _.isEmpty(dropdownStates)}
                       dataSource={dropdownStates} dataSourceConfig={dataSourceConfig}
                       onChange={this.onStateChanged} />
          {statesLoading && <LinearProgress style={loadingProgressStyle} />}
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={lgaIdFieldName} label={formatMessage(messages.lga)}
                       disabled={loading || lgasLoading || _.isEmpty(dropdownLgas)}
                       dataSource={dropdownLgas} dataSourceConfig={dataSourceConfig} />
          {lgasLoading && <LinearProgress style={loadingProgressStyle} />}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  const {formName, initialValues, countryIdFieldName, stateIdFieldName, lgaIdFieldName} = ownProps
  const selectedCountryId = state.getIn(['form', formName, 'values', countryIdFieldName]) || initialValues.get(countryIdFieldName)
  const selectedStateId = state.getIn(['form', formName, 'values', stateIdFieldName]) || initialValues.get(stateIdFieldName)
  const selectedLgaId = state.getIn(['form', formName, 'values', lgaIdFieldName]) || initialValues.get(lgaIdFieldName)
  return {
    countries: state.getIn(['geography', 'countriesForLocationSelector']),
    selectedCountryId,
    selectedStateId,
    selectedLgaId
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchCountriesForLocationSelector,
    fetchStatesForLocationSelector,
    fetchLgasForLocationSelector,
    changeFieldValue
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(LocationSelector)

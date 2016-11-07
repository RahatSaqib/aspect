import React, {PropTypes} from 'react'
import LinearProgress from 'material-ui/LinearProgress'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {change as changeFieldValue} from 'redux-form'
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

const locationSelectorItemsDifferent = (item1, item2) => {
  return (item1 && !item2) || (!item1 && item2) || !(!item1 && !item2) ||
    (item1 && item2 && !_.isEqual(item1.get('id'), item2.get('id')))
}

class LocationSelector extends React.PureComponent {
  static propTypes = {
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    fetchStatesForLocationSelector: PropTypes.func.isRequired,
    fetchLgasForLocationSelector: PropTypes.func.isRequired,
    changeFieldValue: PropTypes.func.isRequired,
    countries: PropTypes.object.isRequired,
    initialValues: PropTypes.object,
    formName: PropTypes.string,
    countryIdFieldName: PropTypes.string.isRequired,
    stateIdFieldName: PropTypes.string.isRequired,
    lgaIdFieldName: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  }

  state = {
    selectedCountryId: undefined,
    selectedStateId: undefined,
    selectedLgaId: undefined
  }

  componentDidMount() {
    const {fetchCountriesForLocationSelector, countries} = this.props,
      {selectedCountryId, selectedStateId} = this.state
    fetchCountriesForLocationSelector(false, countries, selectedCountryId, selectedStateId)
  }

  componentWillReceiveProps(nextProps) {
    this.initialiseSelectionsFromProps(nextProps)
  }

  initialiseSelectionsFromProps(props) {
    const {fetchStatesForLocationSelector, fetchLgasForLocationSelector, initialValues, countryIdFieldName,
      stateIdFieldName, lgaIdFieldName} = props

    let selectedCountryId = this.state.selectedCountryId
    if(!selectedCountryId && initialValues) {
      selectedCountryId = initialValues.get(countryIdFieldName)
    }
    let selectedStateId = this.state.selectedStateId
    if(!selectedStateId && initialValues) {
      selectedStateId = initialValues.get(stateIdFieldName)
    }
    let selectedLgaId = this.state.selectedLgaId
    if(!selectedLgaId && initialValues) {
      selectedLgaId = initialValues.get(lgaIdFieldName)
    }

    const selectedCountry = this.findCountry(selectedCountryId)
    const selectedState = this.findState(selectedCountryId, selectedStateId)

    if(selectedCountry) {
      fetchStatesForLocationSelector(false, selectedCountry)
      if(selectedState) {
        fetchLgasForLocationSelector(false, selectedCountry, selectedState)
      }
    }
    this.setState({
      selectedCountryId,
      selectedStateId,
      selectedLgaId
    })
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

  findLga = (countryId, stateId, lgaId) => {
    const state = this.findState(countryId, stateId)
    if(state && state.getIn(['children', 'items'])) {
      return state.getIn(['children', 'items']).find(lga => lga.get('id') === lgaId)
    }
  }

  onCountryChanged = (event, index, value) => {
    this.selectCountry(this.findCountry(value))
  }

  selectCountry = country => {
    const countryThatWasSelected = this.findCountry(this.state.selectedCountryId)
    if(locationSelectorItemsDifferent(country, countryThatWasSelected)) {
      this.setState({
        selectedCountryId: country ? country.get('id') : undefined,
        selectedStateId: undefined,
        selectedLgaId: undefined
      }, () => {
        const {formName, stateIdFieldName, lgaIdFieldName, changeFieldValue} = this.props
        if(formName && countryThatWasSelected) {
          changeFieldValue(formName, stateIdFieldName, null)
          changeFieldValue(formName, lgaIdFieldName, null)
        }
        if(country) {
          this.props.fetchStatesForLocationSelector(false, country)
        }
      })
    }
  }

  onStateChanged = (event, index, value) => {
    this.selectState(this.findState(this.state.selectedCountryId, value))
  }

  selectState = state => {
    const stateThatWasSelected = this.findState(this.state.selectedCountryId, this.state.selectedStateId)
    if(locationSelectorItemsDifferent(state, stateThatWasSelected)) {
      this.setState({
        selectedStateId: state ? state.get('id') : undefined,
        selectedLgaId: undefined
      }, () => {
        const {formName, lgaIdFieldName, changeFieldValue} = this.props
        if(formName && stateThatWasSelected) {
          changeFieldValue(formName, lgaIdFieldName, null)
        }
        if(state) {
          const selectedCountry = this.findCountry(this.state.selectedCountryId)
          this.props.fetchLgasForLocationSelector(false, selectedCountry, state)
        }
      })
    }
  }

  onLgaChanged = (event, index, value) => {
    this.selectLga(this.findLga(this.state.selectedCountryId, this.state.selectedStateId, value))
  }

  selectLga = lga => {
    const selectedLga = this.findLga(this.state.selectedCountryId, this.state.selectedStateId, this.state.selectedLgaId)
    if(locationSelectorItemsDifferent(lga, selectedLga)) {
      this.setState({
        selectedLgaId: lga ? lga.get('id') : undefined
      })
    }
  }

  render() {
    const { intl: { formatMessage }, disabled, countries, countryIdFieldName, stateIdFieldName, lgaIdFieldName } = this.props
    const dataSourceConfig = { text: 'name', value: 'id' }
    const dropdownCountries = countries ? countries.get('items').toJS() : []
    const countriesLoading = countries ? countries.get('loading') : false
    const selectedCountry = this.findCountry(this.state.selectedCountryId)
    const states = selectedCountry ? selectedCountry.getIn(['children', 'items']) : undefined
    const statesLoading = selectedCountry ? selectedCountry.getIn(['children', 'loading']) : false
    const dropdownStates = states ? states.toJS() : []
    const selectedState = this.findState(this.state.selectedCountryId, this.state.selectedStateId)
    const lgas = selectedState ? selectedState.getIn(['children', 'items']) : undefined
    const lgasLoading = selectedState ? selectedState.getIn(['children', 'loading']) : false
    const dropdownLgas = lgas ? lgas.toJS() : []
    const loadingProgressStyle = {position: 'absolute', bottom: '0.5em', width: '85%'}

    return (
      <div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={countryIdFieldName} label={formatMessage(messages.country)}
                       disabled={disabled || countriesLoading || _.isEmpty(dropdownCountries)}
                       dataSource={dropdownCountries} dataSourceConfig={dataSourceConfig}
                       onChange={this.onCountryChanged} />
          {countriesLoading && <LinearProgress style={loadingProgressStyle} />}
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={stateIdFieldName} label={formatMessage(messages.state)}
                       disabled={disabled || statesLoading || _.isEmpty(dropdownStates)}
                       dataSource={dropdownStates} dataSourceConfig={dataSourceConfig}
                       onChange={this.onStateChanged} />
          {statesLoading && <LinearProgress style={loadingProgressStyle} />}
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={lgaIdFieldName} label={formatMessage(messages.lga)}
                       disabled={disabled || lgasLoading || _.isEmpty(dropdownLgas)}
                       dataSource={dropdownLgas} dataSourceConfig={dataSourceConfig}
                       onChange={this.onLgaChanged} />
          {lgasLoading && <LinearProgress style={loadingProgressStyle} />}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    countries: state.getIn(['geography', 'countriesForLocationSelector'])
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

import React, {PropTypes} from 'react'
import RefreshIndicator from 'material-ui/RefreshIndicator'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  fetchCountriesForLocationSelector,
  fetchStatesForLocationSelector,
  fetchLgasForLocationSelector
} from '../../action_creators/geography_creators'
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
    countries: PropTypes.object.isRequired,
    initialValues: PropTypes.object,
    countryIdFieldName: PropTypes.string.isRequired,
    stateIdFieldName: PropTypes.string.isRequired,
    lgaIdFieldName: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  }

  constructor(props) {
    super(props)
    this.onCountryChanged = this.onCountryChanged.bind(this)
    this.selectCountry = this.selectCountry.bind(this)
    this.onStateChanged = this.onStateChanged.bind(this)
    this.selectState = this.selectState.bind(this)
    this.onLgaChanged = this.onLgaChanged.bind(this)
    this.selectLga = this.selectLga.bind(this)
    this.state = {
      selectedCountry: undefined,
      selectedState: undefined,
      selectedLga: undefined
    }
  }

  selectInitialCountry = props => {
    const {countries} = props
    if(!this.state.selectedCountry) {
      const {initialValues, countryIdFieldName} = props
      const selectedCountry = countries && countries.get('items') && initialValues && initialValues.get(countryIdFieldName) ?
        countries.get('items').find(country => country.get('id') === initialValues.get(countryIdFieldName)) : undefined
      if(selectedCountry) {
        this.selectCountry(selectedCountry)
      }
    } else {
      const selectedCountry = countries && countries.get('items') ?
        countries.get('items').find(
          country => country.get('id') === this.state.selectedCountry.get('id')) : undefined
      this.selectCountry(selectedCountry)
    }
  }

  selectInitialState = props => {
    if(this.state.selectedCountry) {
      const {countries} = props
      if(!this.state.selectedState) {
        const {initialValues, stateIdFieldName} = props,
          states = countries.get('items').find(
            country => country.get('id') === this.state.selectedCountry.get('id')).get('children'),
          selectedState = states && states.get('items') && initialValues && initialValues.get(stateIdFieldName) ?
            states.get('items').find(state => state.get('id') === initialValues.get(stateIdFieldName)) : undefined
        if (selectedState) {
          this.selectState(selectedState)
        }
      } else {
        const selectedCountry = countries && countries.get('items') ?
          countries.get('items').find(
            country => country.get('id') === this.state.selectedCountry.get('id')) : undefined,
          selectedState = selectedCountry && selectedCountry.getIn(['children', 'items']) ?
            selectedCountry.getIn(['children', 'items']).find(
              state => state.get('id') === this.state.selectedState.get('id')) : undefined
        this.selectState(selectedState)
      }
    }
  }

  selectInitialLga = props => {
    if(this.state.selectedCountry && this.state.selectedState) {
      const {countries} = props
      if(!this.state.selectedLga) {
        const {initialValues, stateIdFieldName, lgaIdFieldName} = props,
          states = this.state.selectedCountry.get('children'),
          selectedState = states && states.get('items') && initialValues && initialValues.get(stateIdFieldName) ?
            states.get('items').find(state => state.get('id') === initialValues.get(stateIdFieldName)) : undefined,
          selectedLga = selectedState && selectedState.getIn(['children', 'items']) ?
            selectedState.getIn(['children', 'items']).find(lga => lga.get('id') === initialValues.get(lgaIdFieldName)) : undefined
        if (selectedLga) {
          this.selectLga(selectedLga)
        }
      } else {
        const selectedCountry = countries && countries.get('items') ?
            countries.get('items').find(
              country => country.get('id') === this.state.selectedCountry.get('id')) : undefined,
          selectedState = selectedCountry && selectedCountry.getIn(['children', 'items']) ?
            selectedCountry.getIn(['children', 'items']).find(
              state => state.get('id') === this.state.selectedState.get('id')) : undefined,
          selectedLga = selectedState && selectedState.getIn(['children', 'items']) ?
            selectedState.getIn(['children', 'items']).find(lga => lga.get('id') === this.state.selectedLga.get('id')) : undefined
        this.selectLga(selectedLga)
      }
    }
  }

  componentDidMount() {
    const {fetchCountriesForLocationSelector, countries, initialValues, countryIdFieldName, stateIdFieldName} = this.props
    fetchCountriesForLocationSelector(false, countries, initialValues.get(countryIdFieldName),
      initialValues.get(stateIdFieldName))
    this.selectInitialCountry(this.props)
    this.selectInitialState(this.props)
    this.selectInitialLga(this.props)
  }

  componentWillReceiveProps(newProps) {
    this.selectInitialCountry(newProps)
    this.selectInitialState(newProps)
    this.selectInitialLga(newProps)
  }

  onCountryChanged(event, index, value) {
    const {countries} = this.props
    const selectedCountry = countries.get('items').find(country => country.get('id') === value)
    this.selectCountry(selectedCountry)
  }

  selectCountry(country) {
    if(!_.isEqual(country, this.state.selectedCountry)) {
      this.setState({
        selectedCountry: country
      }, () => {
        if(country) {
          this.props.fetchStatesForLocationSelector(false, country)
        }
        this.selectInitialState(this.props)
      })
    }
  }

  onStateChanged(event, index, value) {
    if(this.state.selectedCountry && this.state.selectedCountry.getIn(['children', 'items'])) {
      const selectedState = this.props.countries.get('items').find(
        country => country.get('id') === this.state.selectedCountry.get('id')).getIn(['children', 'items']).find(
          state => state.get('id') === value)
      this.selectState(selectedState)
    }
  }

  selectState(state) {
    if(!_.isEqual(state, this.state.selectedState)) {
      this.setState({
        selectedState: state
      }, () => {
        if(this.state.selectedCountry && state) {
          this.props.fetchLgasForLocationSelector(false, this.state.selectedCountry, state)
        }
        this.selectInitialLga(this.props)
      })
    }
  }

  onLgaChanged(event, index, value) {
    if(this.state.selectedCountry && this.state.selectedCountry.getIn(['children', 'items']) &&
      this.state.selectedState && this.state.selectedState.getIn(['children', 'items'])) {
      const selectedLga = this.props.countries.get('items').find(
        country => country.get('id') === this.state.selectedCountry.get('id')).getIn(['children', 'items']).find(
          state => state.get('id') === this.state.selectedState.get('id')).getIn(['children', 'items']).find(
            lga => lga.get('id') === value)
      this.selectLga(selectedLga)
    }
  }

  selectLga(lga) {
    if(!_.isEqual(lga, this.state.selectedLga)) {
      this.setState({
        selectedLga: lga
      })
    }
  }

  render() {
    const { formatMessage } = this.props.intl,
      { disabled, countryIdFieldName, countries, stateIdFieldName, lgaIdFieldName } = this.props,
      selectListDataSourceMappings = { text: 'name', value: 'id' },
      countriesForSelectList = countries ? countries.get('items').toJS() : [],
      countriesLoading = countries ? countries.get('loading') : false,
      states = this.state.selectedCountry ? this.state.selectedCountry.getIn(['children', 'items']) : undefined,
      statesLoading = this.state.selectedCountry ? this.state.selectedCountry.getIn(['children', 'loading']) : false,
      statesForSelectList = states ? states.toJS() : [],
      lgas = this.state.selectedState ? this.state.selectedState.getIn(['children', 'items']) : undefined,
      lgasLoading = this.state.selectedState ? this.state.selectedState.getIn(['children', 'loading']) : false,
      lgasForSelectList = lgas ? lgas.toJS() : []

    return (
      <div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={countryIdFieldName} label={formatMessage(messages.country)}
                       disabled={disabled || countriesLoading || _.isEmpty(countriesForSelectList)}
                       dataSource={countriesForSelectList} dataSourceConfig={selectListDataSourceMappings}
                       onChange={this.onCountryChanged} />
          <RefreshIndicator size={30} left={100} top={30} status={countriesLoading ? 'loading' : 'hide'} />
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={stateIdFieldName} label={formatMessage(messages.state)}
                       disabled={disabled || statesLoading || _.isEmpty(statesForSelectList)}
                       dataSource={statesForSelectList} dataSourceConfig={selectListDataSourceMappings}
                       onChange={this.onStateChanged} />
          <RefreshIndicator size={30} left={100} top={30} status={statesLoading ? 'loading' : 'hide'} />
        </div>
        <div style={{display: 'inline-block', position: 'relative'}}>
          <SelectInput name={lgaIdFieldName} label={formatMessage(messages.lga)}
                       disabled={disabled || lgasLoading || _.isEmpty(lgasForSelectList)}
                       dataSource={lgasForSelectList} dataSourceConfig={selectListDataSourceMappings}
                       onChange={this.onLgaChanged} />
          <RefreshIndicator size={30} left={100} top={30} status={lgasLoading ? 'loading' : 'hide'} />
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
    fetchLgasForLocationSelector
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(LocationSelector)

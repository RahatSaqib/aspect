import _ from 'lodash'
import React from 'react'
import LinearProgress from 'material-ui/LinearProgress'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Field, change as changeFieldValue } from 'redux-form/immutable'

import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField, {
  getSelectedCountry
} from '../../filter/geography/StateSelectField'
import LgaSelectField, {
  getSelectedState
} from '../../filter/geography/LgaSelectField'

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

const styles = {
  fieldContainer: {
    display: 'inline-block',
    position: 'relative'
  },
  field: {
    verticalAlign: 'bottom'
  },
  loadingProgress: {
    position: 'absolute',
    bottom: '0.5em',
    width: '85%'
  }
}

const renderCountrySelectField = ({ input, meta, ...restProps }) => (
  <CountrySelectField
    {...restProps}
    onChangeCountry={input.onChange}
    countryId={input.value}
    errorStyle={{ float: 'left' }}
    errorText={meta.touched && meta.error}
    tabIndex="0" aria-haspopup
  />
)

const renderStateSelectField = ({ input, meta, ...restProps }) => (
  <StateSelectField
    {...restProps}
    onChangeState={input.onChange}
    stateId={input.value}
    errorStyle={{ float: 'left' }}
    errorText={meta.touched && meta.error}
    tabIndex="0" aria-haspopup
  />
)

const renderLgaSelectField = ({ input, meta, ...restProps }) => (
  <LgaSelectField
    {...restProps}
    onChangeLga={input.onChange}
    lgaId={input.value}
    errorStyle={{ float: 'left' }}
    errorText={meta.touched && meta.error}
    tabIndex="0" aria-haspopup
  />
)

class LocationSelector extends React.PureComponent {
  componentWillReceiveProps(nextProps) {
    const { selectedCountryId, selectedStateId } = this.props
    const { changeFieldValue, formName, stateIdFieldName, lgaIdFieldName } = nextProps
    if (!_.isEmpty(selectedCountryId) && selectedCountryId !== nextProps.selectedCountryId) {
      changeFieldValue(formName, stateIdFieldName, null)
      changeFieldValue(formName, lgaIdFieldName, null)
    } else if (!_.isEmpty(selectedStateId) && selectedStateId !== nextProps.selectedStateId) {
      changeFieldValue(formName, lgaIdFieldName, null)
    }
  }

  render() {
    const { intl: { formatMessage }, loading, countries,
      countryIdFieldName, stateIdFieldName, lgaIdFieldName,
      selectedCountryId, selectedStateId } = this.props

    const countriesLoading = loading || countries.loading
    const countriesDisabled = countriesLoading || countries.items.isEmpty()

    const selectedCountry = getSelectedCountry({ countries, countryId: selectedCountryId })
    const statesLoading = !!selectedCountry && selectedCountry.children.loading
    const statesDisabled = !selectedCountry || statesLoading || selectedCountry.children.items.isEmpty()

    const selectedState = getSelectedState({ countries, countryId: selectedCountryId, stateId: selectedStateId })
    const lgasLoading = !!selectedState && selectedState.children.loading
    const lgasDisabled = !selectedState || lgasLoading || selectedState.children.items.isEmpty()

    console.log(`[LocationSelector] selectedCountryId:${selectedCountryId}, selectedStateId:${selectedStateId}`)

    return (
      <div>
        <div style={styles.fieldContainer}>
          <Field
            name={countryIdFieldName}
            component={renderCountrySelectField}
            // restProps
            floatingLabelText={formatMessage(messages.country)}
            style={styles.field}
            disabled={countriesDisabled}
          />
          {countriesLoading && <LinearProgress style={styles.loadingProgress} />}
        </div>
        <div style={styles.fieldContainer}>
          <Field
            name={stateIdFieldName}
            component={renderStateSelectField}
            // restProps
            countryId={selectedCountryId}
            floatingLabelText={formatMessage(messages.state)}
            style={styles.field}
            disabled={statesDisabled}
          />
          {statesLoading && <LinearProgress style={styles.loadingProgress} />}
        </div>
        <div style={styles.fieldContainer}>
          <Field
            name={lgaIdFieldName}
            component={renderLgaSelectField}
            // restProps
            countryId={selectedCountryId}
            stateId={selectedStateId}
            floatingLabelText={formatMessage(messages.lga)}
            style={styles.field}
            disabled={lgasDisabled}
          />
          {lgasLoading && <LinearProgress style={styles.loadingProgress} />}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  const { formName, initialValues, countryIdFieldName, stateIdFieldName, lgaIdFieldName } = ownProps
  const selectedCountryId = state.getIn(['form', formName, 'values', countryIdFieldName])
  const selectedStateId = state.getIn(['form', formName, 'values', stateIdFieldName])
  const selectedLgaId = state.getIn(['form', formName, 'values', lgaIdFieldName])
  return {
    countries: state.getIn(['geography', 'countriesForLocationSelector']),
    selectedCountryId,
    selectedStateId,
    selectedLgaId
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    changeFieldValue
  }, dispatch)
}

export default _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(LocationSelector)

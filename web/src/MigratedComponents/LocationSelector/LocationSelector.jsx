import React, { useState } from 'react'

import CountrySelectField from '../Geography/CountrySelectField'
import StateSelectField from '../Geography/StateSelectField'
import LgaSelectField from '../Geography/LgaSelectField'
import { getCustomMessage } from '../../shared/utils/customMessages'
import messages from './messages'
import styles from './styles'
import useI18n from '../../Hooks/i18n/useI18n'

const LocationSelector = ({ countryId, stateId, lgaId, user, onChange }) => {
  const { formatMessage } = useI18n()
  const [selectedCountry, setSelectedCountry] = useState({ id: countryId, name: '' })
  const [selectedState, setSelectedState] = useState({ id: stateId, name: '' })
  const [selectedLga, setSelectedLga] = useState({ id: lgaId, name: '' })

  const updateCountry = country => {
    setSelectedCountry(country || { id: null, name: null })
    onChange({
      country: country || { id: null, name: null },
      state: { id: null, name: null },
      lga: { id: null, name: null },
    })
  }

  const updateState = state => {
    setSelectedState(state || { id: null, name: null })
    onChange({
      country: selectedCountry,
      state: state || { id: null, name: null },
      lga: { id: null, name: null },
    })
  }

  const updateLga = lga => {
    setSelectedLga(lga || { id: null, name: null })
    onChange({
      country: selectedCountry,
      state: selectedState,
      lga: lga || { id: null, name: null },
    })
  }

  return (
    <>
      <div style={styles.fieldContainer}>
        <CountrySelectField
          onCountryIdChange={updateCountry}
          countryId={selectedCountry.id}
          errorStyle={{ float: 'left', whiteSpace: 'nowrap', textOverflow: 'visible' }}
          // errorText={meta.touched && meta.error}
          tabIndex="0"
          aria-haspopup
          floatingLabelText={formatMessage(messages.country)}
          style={styles.field}
        />
      </div>
      <div style={styles.fieldContainer}>
        <StateSelectField
          onStateIdChange={updateState}
          stateId={selectedState.id}
          countryId={selectedCountry.id}
          errorStyle={{ float: 'left', whiteSpace: 'nowrap', textOverflow: 'visible' }}
          // errorText={meta.touched && meta.error}
          tabIndex="0"
          aria-haspopup
          floatingLabelText={getCustomMessage(messages, 'state', user)}
          style={styles.field}
        />
      </div>
      <div style={styles.fieldContainer}>
        <LgaSelectField
          onLgaIdChange={updateLga}
          countryId={selectedCountry.id}
          stateId={selectedState.id}
          lgaId={selectedLga.id}
          errorStyle={{ float: 'left', whiteSpace: 'nowrap', textOverflow: 'visible' }}
          // errorText={meta.touched && meta.error}
          tabIndex="0"
          aria-haspopup
          floatingLabelText={getCustomMessage(messages, 'lga', user)}
          style={styles.field}
        />
      </div>
    </>
  )
}

// function mapStateToProps(state, ownProps) {
//   const { formName, countryIdFieldName, stateIdFieldName, lgaIdFieldName } = ownProps
//   const selectedCountryId = state.getIn(['form', formName, 'values', countryIdFieldName])
//   const selectedStateId = state.getIn(['form', formName, 'values', stateIdFieldName])
//   const selectedLgaId = state.getIn(['form', formName, 'values', lgaIdFieldName])
//   return {
//     countries: state.getIn(['geography', 'countriesForLocationSelector']),
//     selectedCountryId,
//     selectedStateId,
//     selectedLgaId,
//     user: state.user,
//   }
// }

// function mapDispatchToProps(dispatch) {
//   return bindActionCreators({ changeFieldValue }, dispatch)
// }

// export default flowRight(injectIntl, connect(mapStateToProps, mapDispatchToProps))(LocationSelector)
export default LocationSelector

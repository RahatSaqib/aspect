import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { getCustomMessage } from '../../messages/customMessages'
import CountrySelectField from '../Geography/CountrySelectField'
import LgaSelectField from '../Geography/LgaSelectField'
import StateSelectField from '../Geography/StateSelectField'
import messages from './messages'
import styles from './styles'

const LocationSelector = ({ countryId, stateId, lgaId, user, onChange, validators }) => {
  const { formatMessage } = useIntl()
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
          error={validators.country.error}
          helperText={formatMessage(messages.countryRequired)}
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
          error={validators.state.error}
          countryId={selectedCountry.id}
          tabIndex="0"
          aria-haspopup
          helperText={formatMessage(messages.isRequired, {
            entity: getCustomMessage(formatMessage, messages, 'state', user),
          })}
          floatingLabelText={getCustomMessage(formatMessage, messages, 'state', user)}
          style={styles.field}
        />
      </div>
      <div style={styles.fieldContainer}>
        <LgaSelectField
          onLgaIdChange={updateLga}
          countryId={selectedCountry.id}
          stateId={selectedState.id}
          lgaId={selectedLga.id}
          tabIndex="0"
          aria-haspopup
          floatingLabelText={getCustomMessage(formatMessage, messages, 'lga', user)}
          style={styles.field}
        />
      </div>
    </>
  )
}

export default LocationSelector

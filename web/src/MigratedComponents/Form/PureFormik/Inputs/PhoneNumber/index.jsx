import React from 'react'
import { useSelector } from 'react-redux'
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy'
import map from 'lodash/map'
import { PureSelect, PureTextInput } from '../index'
import useI18n from '../../../../../Hooks/i18n/useI18n'
import messages from '../../messages'
import dialCodes from '../../../../../filter/hardcoded/dialCodes'
import countries from '../../../../../filter/hardcoded/countries'

const PurePhoneNumber = props => {
  const { countryAbbreviation } = useSelector(({ user }) => user.toJS())
  const { formatMessage } = useI18n()
  const { inputProps, form } = props
  const { id } = inputProps
  const { values } = form
  const dialCodeProps = cloneDeep(props)
  const numberProps = cloneDeep(props)
  const sortedDialCodes = sortBy(dialCodes, ({ isoAlpha2Code }) =>
    isoAlpha2Code === countryAbbreviation ? 0 : 1
  )
  dialCodeProps.inputProps.label = formatMessage(messages.dialCode)
  dialCodeProps.inputProps.options = map(
    sortedDialCodes,
    ({ dialCode, isoAlpha2Code }) => {
      const country = filter(countries, { isoAlpha2Code })[0]?.name || 'US'
      return {
        label: `${dialCode} (${country})`,
        value: dialCode,
      }
    }
  )

  if (!isEmpty(values[id])) {
    const number = new AsYouType().input(values[id])
    const { countryCallingCode } = parsePhoneNumber(number) || false
    numberProps.form.values[id] = number
    if (countryCallingCode) {
      dialCodeProps.form.values[id] = `+${countryCallingCode}`
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 2, marginRight: '20px' }}>
        <PureSelect {...dialCodeProps} />
      </div>
      <div style={{ flex: 4 }}>
        <PureTextInput {...numberProps} />
      </div>
    </div>
  )
}

export default PurePhoneNumber

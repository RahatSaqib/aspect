import React from 'react'
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js'
import cloneDeep from 'lodash/cloneDeep'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import useI18n from '../../../../../hooks/useI18n'
import countries from '../../../../../oldComponents/filter/hardcoded/countries'
import dialCodes from '../../../../../oldComponents/filter/hardcoded/dialCodes'
import messages from '../../messages'
import { PureSelect, PureTextInput } from '../index'

const RenderPhoneNumber = ({ dialCodeProps, numberProps }) => {
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

const PurePhoneNumber = props => {
  const { formatMessage } = useI18n()
  const {
    inputProps: { id },
    form: { values },
  } = props
  const numberProps = cloneDeep(props)
  const dialCodeProps = cloneDeep(props)
  const { form: numberForm } = numberProps
  const { inputProps: dialCodeInputProps, form: dialCodeForm } = dialCodeProps

  dialCodeInputProps.label = formatMessage(messages.dialCode)
  dialCodeInputProps.options = map(dialCodes, ({ dialCode, isoAlpha2Code }) => {
    const country = filter(countries, { isoAlpha2Code })[0]?.name || 'US'
    return {
      label: `${dialCode} (${country})`,
      value: dialCode,
    }
  })

  if (!isEmpty(values[id])) {
    const number = new AsYouType().input(values[id])
    const { countryCallingCode } = parsePhoneNumber(number) || false

    numberForm.values[id] = number
    if (countryCallingCode) {
      dialCodeForm.values[id] = `+${countryCallingCode}`
    }
  }

  return <RenderPhoneNumber dialCodeProps={dialCodeProps} numberProps={numberProps} />
}

export default PurePhoneNumber

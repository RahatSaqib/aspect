import React from 'react'
import map from 'lodash/map'
import languages from '../../../../filter/hardcoded/languages'
import { PureSelect } from '../../../Form/PureFormik/Inputs'
import FlagIcon from '../../../../components/shared/flagIcon/FlagIcon'

const RenderOption = props => {
  const { option } = props
  return (
    <div {...props}>
      <div style={{ marginRight: '10px' }}>
        <FlagIcon countryIsoAlpha2Code={option.iso} />
      </div>{' '}
      {option.label}
    </div>
  )
}

const LanguageSelect = props => {
  const { inputProps } = props

  inputProps.options = map(languages, ({ culture, languageName, isoAlpha2Code }) => ({
    label: languageName,
    value: culture,
    iso: isoAlpha2Code,
  }))

  inputProps.renderOption = RenderOption

  return <PureSelect {...props} />
}

export default LanguageSelect

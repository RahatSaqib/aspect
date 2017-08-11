import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Dropdown } from 'react-toolbox/lib/dropdown'

import FlagIcon from '../../components/shared/flagIcon/FlagIcon'
import countries from './countries'
import dialCodes from './dialCodes'

const cssClasses = classnames.bind(require('./DialCodeDropdown.css'))

const countryBy = _.keyBy(countries, 'iso_alpha2_code')

const dialCodesWithCountry = dialCodes.map(
  ({ dial_code, iso_alpha2_code }) => ({
    iso_alpha2_code,
    dial_code,
    country_name: countryBy[iso_alpha2_code].name,
  })
)

const enhance = _.identity

const template = ({
  dial_code: dialCode,
  iso_alpha2_code: countryIsoAlpha2Code,
  country_name: countryName,
}) =>
  <span>
    <FlagIcon withRightMargin countryIsoAlpha2Code={countryIsoAlpha2Code} />
    <span className={cssClasses('Item--hidden')}>
      {countryName} (
    </span>
    {dialCode}
    <span className={cssClasses('Item--hidden')}>)</span>
  </span>

export const DialCodeDropdown = props =>
  <Dropdown
    {...props}
    template={template}
    valueKey="dial_code"
    source={dialCodesWithCountry}
    theme={{
      ...props.theme,
      templateValue: cssClasses(
        _.get(props, 'theme.templateValue'),
        'Dropdown__templateValue'
      ),
    }}
  />

export default enhance(DialCodeDropdown)

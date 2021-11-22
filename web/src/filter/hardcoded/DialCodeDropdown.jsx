import React from 'react'
import keyBy from 'lodash/keyBy'
import filter from 'lodash/filter'
import Select from 'react-select'
import parsePhoneNumber from 'libphonenumber-js'
import { getMuiTheme } from '../../MigratedComponents/AspectDropDown'
import countries from './countries'
import dialCodes from './dialCodes'

const countryBy = keyBy(countries, 'isoAlpha2Code')

const dialCodesWithCountry = dialCodes.map(({ dialCode, isoAlpha2Code }) => ({
  label: `${dialCode} (${countryBy[isoAlpha2Code].name})`,
  value: dialCode,
  iso: isoAlpha2Code,
}))

export const DialCodeDropdown = ({ onChange, name, value, countryId }) => {
  const parsed = value?.numberPart ? parsePhoneNumber(value?.fullNumber) : false
  const filterByCountryId = parsed ? parsed.country : countryId

  return (
    <div style={{ width: '350px', padding: '20px 0', marginRight: '30px' }}>
      <Select
        name={`${name}-country-code`}
        id={`${name}-country-code`}
        isDisabled={false}
        isLoading={false}
        isMulti={false}
        defaultValue={
          filter(
            dialCodesWithCountry,
            ({ iso }) => iso === filterByCountryId
          )[0]
        }
        options={dialCodesWithCountry}
        styles={getMuiTheme()}
        onChange={selected => onChange({ dialCode: selected?.value, value })}
        // noOptionsMessage={() => formatMessage(messagesBase.noOptionsMessage)}
      />
    </div>
  )
}

export default DialCodeDropdown

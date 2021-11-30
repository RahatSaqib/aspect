import React, { useState, useEffect } from 'react'
import filter from 'lodash/filter'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import classnames from 'classnames/bind'
import { compose, withProps, withHandlers, pure } from 'recompose'
import TextField from '@material-ui/core/TextField'
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js'

import DialCodeDropdown from './DialCodeDropdown'
import dialCodes from './dialCodes'
import countries from './countries'

import styles from './DialCodeDropdownInput.css'

const cssClasses = classnames.bind(styles)

function getDialingByName(countryName, options) {
  return filter(options, ({ name }) => name === countryName)[0]
}

function getDialingByCode(code, options) {
  return filter(options, ({ value }) => {
    return value === code
  })[0]
}

const enhance = compose(
  pure,
  withProps(props => {
    const countryBy = keyBy(countries, 'isoAlpha2Code')
    const dialCodeOptions = map(dialCodes, ({ dialCode, isoAlpha2Code }) => ({
      label: `${dialCode} (${countryBy[isoAlpha2Code].name})`,
      value: dialCode,
      name: countryBy[isoAlpha2Code].name,
      iso: isoAlpha2Code,
    }))
    const dialCode =
      parsePhoneNumber(props?.value) ||
      getDialingByName(props?.country, dialCodeOptions)?.value
    // console.log(props, dialCode)

    return {
      dialCodeOptions,
      dialCode: props?.dialCode,
      fullNumber: props?.value,
    }
  }),
  withHandlers({
    // onDialCodeChange: a => b => {
    //   console.log({ a, b })

    //   // onChange(dialCode)
    // },
    onDialCodeChange:
      ({ onChange, ...rest }) =>
      ({ dialCode }) => {
        console.log(rest)

        onChange(dialCode)
      },
    // {
    //   onChange,
    //   fullNumber,
    //   dialCode,
    //   label,
    //   country,
    //   dialCodesWithCountry,
    //   ...rest
    // }

    onRawNumberChange:
      ({ onChange, dialCode, dialCodeOptions, fullNumber }) =>
      ({ target: { value: rawNumber } }) => {
        console.log({ dialCode, rawNumber, fullNumber })
        // const iso = getDialingByCode(dialCode, dialCodeOptions)

        // const { iso } = dialCode
        //   ? getDialingByCode(dialCode, dialCodesWithCountry)
        //   : getDialingByName(country, dialCodesWithCountry)
        // console.log(dialCode, iso, rawNumber)
        // const newNumber = dialCode
        //   ? `${dialCode}${rawNumber}`
        //   : `huh${rawNumber}`
        onChange(new AsYouType().input(rawNumber))
      },
    // ({ onChange, dialCode, numberPart }) =>
    // a => {
    //   // const { value: numberPart } = target
    //   console.log({ a, onChange, dialCode, numberPart })

    //   // if (!Number.isNaN(numberPart)) {
    //   //   let outNumber = numberPart
    //   //   if (!outNumber.includes(dialCode)) {
    //   //     outNumber = `${dialCode}${numberPart}`
    //   //   }
    //   //   onChange(outNumber.trim())
    //   // }
    // },
  })
)

// const NumberWithDialingCode = ({
//   fullNumber,
//   onRawNumberChange,
//   ...restProps
// }) => {
//   // console.log(restProps)

//   return (
//     <TextField
//       fullWidth
//       type="text"
//       {...restProps}
//       className={cssClasses('Input')}
//       value={fullNumber}
//       onChange={onRawNumberChange}
//       // onChange={{ onChange: onRawNumberChange, dialCode, numberPart }}
//     />
//   )
// }

const DialCodeDropdownInput = props => {
  const {
    dialCode,
    numberPart,
    onDialCodeChange,
    onRawNumberChange,
    fullNumber,
    country,
    value,
    name,
    dialCodeOptions,
    ...restProps
  } = props

  // const [dialCodeOptions, setDialCodeOptions] = useState(false)

  // useEffect(() => {
  //   if (countries && dialCodes && !dialCodeOptions) {
  //     const countryBy = keyBy(countries, 'isoAlpha2Code')
  //     setDialCodeOptions(
  //       map(dialCodes, ({ dialCode, isoAlpha2Code }) => ({
  //         label: `${dialCode} (${countryBy[isoAlpha2Code].name})`,
  //         value: dialCode,
  //         name: countryBy[isoAlpha2Code].name,
  //         iso: isoAlpha2Code,
  //       }))
  //     )
  //   }
  // }, [dialCodeOptions])

  return dialCodeOptions ? (
    <div className={cssClasses(restProps.className, 'Container')}>
      <DialCodeDropdown
        value={dialCode}
        options={dialCodeOptions}
        onChange={onDialCodeChange}
        country={country}
        defaultValue={getDialingByName(country, dialCodeOptions)}
      />
      {/* <TextField
        fullWidth
        type="text"
        dialCodeOptions={dialCodeOptions}
        {...restProps}
        className={cssClasses('Input')}
        value={fullNumber || getDialingByName(country, dialCodeOptions)?.value}
        // onChange={onRawNumberChange}
        onChange={val => onRawNumberChange({ fullNumber: val, dialCode })}
      /> */}
    </div>
  ) : null
}

export default enhance(DialCodeDropdownInput)

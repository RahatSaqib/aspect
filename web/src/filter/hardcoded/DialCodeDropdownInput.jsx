import React, { Fragment, useState, useEffect } from 'react'
import filter from 'lodash/filter'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import findIndex from 'lodash/findIndex'
import classnames from 'classnames/bind'
import { compose, withProps, withHandlers, pure } from 'recompose'
import TextField from '@material-ui/core/TextField'
import Select from 'react-select'
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js'

import { getMuiTheme } from '../../MigratedComponents/AspectDropDown'
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

const CountryCodeAndNumber = props => {
  const { name, values, dialCodeOptions: options } = props
  const { country } = values || 'United States'
  const [selected, setSelected] = useState(false)
  const [dialCode, setDialCode] = useState(false)
  const [fullNumber, setFullNumber] = useState(false)

  function handleChange(vals) {
    console.log(vals, values)
  }

  useEffect(() => {
    const code = getDialingByName(country, options)
    if (code && !fullNumber) {
      setFullNumber(code?.value)
    }
    if (code && !selected) {
      const selectedIndex = findIndex(options, { value: code?.value })
      setSelected(selectedIndex)
    }
    if (dialCode && code !== dialCode) {
      console.log(code, dialCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, options, country])

  return selected ? (
    <Fragment>
      <div style={{ width: '350px', padding: '20px 0', marginRight: '30px' }}>
        <Select
          name={`${name}-country-code`}
          isDisabled={false}
          isLoading={false}
          isMulti={false}
          options={options}
          defaultValue={options[selected]}
          styles={getMuiTheme()}
          // onChange={handleChange}
          // noOptionsMessage={() => formatMessage(messagesBase.noOptionsMessage)}
        />
      </div>
      <TextField
        fullWidth
        type="text"
        // dialCodeOptions={dialCodeOptions}
        // {...restProps}
        className={cssClasses('Input')}
        value={fullNumber || ''}
        onChange={handleChange}
        // onChange={val => onRawNumberChange({ fullNumber: val, dialCode })}
      />
    </Fragment>
  ) : null
}

const DialCodeDropdownInput = props => {
  const {
    // dialCode,
    // numberPart,
    // onDialCodeChange,
    // onRawNumberChange,
    // fullNumber,
    // country,
    // value,
    // name,
    className,
    dialCodeOptions,
    // ...restProps
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

  // console.log(fullNumber, dialCode, getDialingByName(country, dialCodeOptions))

  return dialCodeOptions ? (
    <div className={cssClasses(className, 'Container')}>
      <CountryCodeAndNumber {...props} />
      {/* <DialCodeDropdown
        value={dialCode || getDialingByName(country, dialCodeOptions)?.value}
        options={dialCodeOptions}
        onChange={onDialCodeChange}
        country={country}
      />
      <TextField
        fullWidth
        type="text"
        // dialCodeOptions={dialCodeOptions}
        {...restProps}
        className={cssClasses('Input')}
        value={fullNumber || getDialingByName(country, dialCodeOptions)?.value}
        onChange={onRawNumberChange}
        // onChange={val => onRawNumberChange({ fullNumber: val, dialCode })}
      /> */}
    </div>
  ) : null
}

export default enhance(DialCodeDropdownInput)

import keyBy from 'lodash/keyBy'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure } from 'recompose'
import TextField from '@material-ui/core/TextField'
import parsePhoneNumber from 'libphonenumber-js'

import DialCodeDropdown from './DialCodeDropdown'
import dialCodes from './dialCodes'

import styles from './DialCodeDropdownInput.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  pure,
  withProps(props => {
    const { countryCallingCode, nationalNumber } =
      parsePhoneNumber(props?.value) || false
    return {
      numberPart: nationalNumber,
      dialCode: countryCallingCode,
      fullNumber: props?.value,
    }
  }),
  withHandlers({
    onDialCodeChange:
      ({ onChange }) =>
      ({ dialCode }) => {
        onChange(dialCode)
      },

    onRawNumberChange:
      ({ onChange, fullNUmber }) =>
      a => {
        console.log(fullNumber, a)
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

const DialCodeDropdownInput = ({
  dialCode,
  numberPart,
  onDialCodeChange,
  onRawNumberChange,
  fullNumber,
  countryId,
  ...restProps
}) => (
  <div className={cssClasses(restProps.className, 'Container')}>
    <DialCodeDropdown
      value={{ fullNumber, numberPart, dialCode }}
      onChange={onDialCodeChange}
      name={restProps?.name}
      countryId={countryId}
    />
    <TextField
      fullWidth
      type="text"
      {...restProps}
      className={cssClasses('Input')}
      value={fullNumber}
      onChange={onRawNumberChange}
      // onChange={{ onChange: onRawNumberChange, dialCode, numberPart }}
    />
  </div>
)

export default enhance(DialCodeDropdownInput)

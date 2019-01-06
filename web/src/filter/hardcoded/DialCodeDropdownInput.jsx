import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure } from 'recompose'
import TextField from '@material-ui/core/TextField'

import DialCodeDropdown from './DialCodeDropdown'
import dialCodes from './dialCodes'

const cssClasses = classnames.bind(require('./DialCodeDropdownInput.css'))

const dialCodeBy = _.keyBy(dialCodes, 'dial_code')

export const parseRawNumber = rawNumber => {
  let numberPart = rawNumber.replace(/^\s+/, '')

  // Get the trimmed first portion of the number
  // (up until the first char which isn't '+' or [0-9]
  const firstPortionDividerMatch = /\s|\(|\)|-/.exec(numberPart)
  const firstIndexOfSectionDivider = firstPortionDividerMatch
    ? firstPortionDividerMatch.index
    : -1
  const nextDialCode =
    firstIndexOfSectionDivider > -1
      ? numberPart.substr(0, firstIndexOfSectionDivider)
      : numberPart

  if (nextDialCode in dialCodeBy) {
    numberPart = numberPart.substr(nextDialCode.length)
  }
  if (/^[\s()+-]*([0-9][\s()+-]*){0,17}$/.test(numberPart)) {
    numberPart = numberPart.replace(/^\s+/, '')
  }

  return {
    numberPart,
    nextDialCode,
  }
}

const enhance = compose(
  pure,
  withProps(props => {
    const { numberPart, nextDialCode } = parseRawNumber(props.value)

    return {
      numberPart,
      dialCode: nextDialCode,
    }
  }),
  withHandlers({
    onDialCodeChange: ({ onChange, numberPart }) => dialCode => {
      onChange(`${dialCode} ${numberPart}`.trim())
    },

    onRawNumberChange: ({ onChange, dialCode }) => ({
      target: { value: rawNumber },
    }) => {
      if (rawNumber) {
        const { numberPart, nextDialCode } = parseRawNumber(rawNumber)
        if (nextDialCode in dialCodeBy) {
          onChange(`${nextDialCode} ${numberPart}`.trim())
        } else {
          onChange(`${dialCode} ${numberPart}`.trim())
        }
      } else {
        onChange(rawNumber)
      }
    },
  })
)

const themes = {
  DialCodeDropdown: {
    dropdown: cssClasses('DialCodeDropdown__dropdown'),
  },
}

const DialCodeDropdownInput = ({
  dialCode,
  numberPart,
  onDialCodeChange,
  onRawNumberChange,
  ...restProps
}) => (
  <div className={cssClasses(restProps.className, 'Container')}>
    <DialCodeDropdown
      value={dialCode}
      onChange={onDialCodeChange}
      theme={themes.DialCodeDropdown}
    />
    <TextField
      fullWidth
      type="text"
      {...restProps}
      className={cssClasses('Input')}
      value={numberPart}
      onChange={onRawNumberChange}
    />
  </div>
)

export default enhance(DialCodeDropdownInput)

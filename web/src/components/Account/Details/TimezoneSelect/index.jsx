import React from 'react'
import map from 'lodash/map'
import timezones from '../../../../oldComponents/filter/hardcoded/timezones'
import { PureSelect } from '../../../Form/PureFormik/Inputs'

const TimezoneSelect = props => {
  const { inputProps } = props

  inputProps.options = map(timezones, ({ id, name }) => ({
    label: name,
    value: id,
  }))

  return <PureSelect {...props} />
}

export default TimezoneSelect

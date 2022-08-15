// Imports from packages
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import { injectIntl, defineMessages } from 'react-intl'

import SelectField from '../../shared/SelectField'
import PropTypeOf from '../../../utils/types'

const messages = defineMessages({
  optionUp: {
    id: 'pages.DeviceStatusSelectField.up',
    defaultMessage: 'Up',
  },
  optionDown: {
    id: 'pages.DeviceStatusSelectField.down',
    defaultMessage: 'Down',
  },
  optionUnknown: {
    id: 'pages.DeviceStatusSelectField.unknown',
    defaultMessage: 'Unknown',
  },
  optionAll: {
    id: 'pages.DeviceStatusSelectField.all',
    defaultMessage: 'All',
  },
})

const options = {
  up: ['active', 'reportedActive', 'inactiveNoTestsPerformed'],
  down: [
    'inactiveOutOfInventory',
    'inactiveDownForRepair',
    'inactiveNoStaff',
    'inactiveNoPower',
    'inactiveNoSamples',
    'inactiveOther',
  ],
  unknown: ['inactiveUnknown'],
}

const getCurrentValue = value => {
  value = Array.isArray(value) ? value : [value]

  return Object.keys(options).reduce((prev, key) => {
    if (options[key].sort().join(',') === value.sort().join(',')) return key
    return prev
  }, '')
}

const DeviceStatusSelectField = props => {
  const handleChange = ({ target: { value } }) => {
    props.onDeviceMaintenanceStatusChange(value.includes('all') ? undefined : options[value])
  }

  const value = getCurrentValue(props.value)

  const restProps = omit(props, ['value', 'onDeviceMaintenanceStatusChange'])

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      <MenuItem value="all">{props.intl.formatMessage(messages.optionAll)}</MenuItem>
      <MenuItem value="up" style={{ color: '#99D25D' }}>
        {props.intl.formatMessage(messages.optionUp)}
      </MenuItem>
      <MenuItem value="down" style={{ color: '#DB3018' }}>
        {props.intl.formatMessage(messages.optionDown)}
      </MenuItem>
      <MenuItem value="unknown" style={{ color: '#F7B500' }}>
        {props.intl.formatMessage(messages.optionUnknown)}
      </MenuItem>
    </SelectField>
  )
}

DeviceStatusSelectField.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  onDeviceMaintenanceStatusChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
}

DeviceStatusSelectField.defaultProps = {
  value: '',
}

export default injectIntl(DeviceStatusSelectField)

// Imports from packages
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import { injectIntl, defineMessages } from 'react-intl'

import SelectField from '../../components/shared/SelectField'
import PropTypeOf from '../../shared/types'

const messages = defineMessages({
  optionOffline: {
    id: 'pages.gxConnectStatusSelectField.offline',
    defaultMessage: 'Offline',
  },
  optionOnline: {
    id: 'pages.gxConnectStatusSelectField.online',
    defaultMessage: 'Online',
  },
})
const GxConnectStatusSelectField = props => {
  const handleChange = ({ target: { value } }) => {
    props.onGxConnectStatusChange(value === 'all' ? undefined : value)
  }

  const { value } = props
  const restProps = omit(props, ['value', 'onGxConnectStatusChange'])

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      <MenuItem value="offline">{props.intl.formatMessage(messages.optionOffline)}</MenuItem>
      <MenuItem value="online">{props.intl.formatMessage(messages.optionOnline)}</MenuItem>
    </SelectField>
  )
}

GxConnectStatusSelectField.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  onGxConnectStatusChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

GxConnectStatusSelectField.defaultProps = {
  value: '',
}

export default injectIntl(GxConnectStatusSelectField)

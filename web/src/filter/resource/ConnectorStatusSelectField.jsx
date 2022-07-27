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
    id: 'pages.connectorStatusSelectField.offline',
    defaultMessage: 'Offline',
  },
  optionOnline: {
    id: 'pages.connectorStatusSelectField.online',
    defaultMessage: 'Online',
  },
})
const ConnectorStatusSelectField = props => {
  const handleChange = ({ target: { value } }) => {
    props.onConnectorStatusChange(value === 'all' ? undefined : value)
  }

  const { value } = props
  const restProps = omit(props, ['value', 'onConnectorStatusChange'])

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      <MenuItem value="offline">{props.intl.formatMessage(messages.optionOffline)}</MenuItem>
      <MenuItem value="online">{props.intl.formatMessage(messages.optionOnline)}</MenuItem>
    </SelectField>
  )
}

ConnectorStatusSelectField.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  onConnectorStatusChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

ConnectorStatusSelectField.defaultProps = {
  value: '',
}

export default injectIntl(ConnectorStatusSelectField)

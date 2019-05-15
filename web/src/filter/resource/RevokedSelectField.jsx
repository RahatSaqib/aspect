// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import { injectIntl, defineMessages, intlShape } from 'react-intl'

import SelectField from '../../components/shared/SelectField'

const messages = defineMessages({
  optionFalse: {
    id: 'pages.revokedSelectField.false',
    defaultMessage: 'False',
  },
  optionTrue: {
    id: 'pages.revokedSelectField.true',
    defaultMessage: 'True',
  },
})
const RevokedSelectField = props => {
  const handleChange = ({ target: { value } }) => {
    props.onRevokedChange(value === 'all' ? undefined : value)
  }

  const { allItemText, value } = props
  const restProps = _.omit(props, ['allItemText', 'value'])

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      <MenuItem value="0">
        {props.intl.formatMessage(messages.optionFalse)}
      </MenuItem>
      <MenuItem value="1">
        {props.intl.formatMessage(messages.optionTrue)}
      </MenuItem>
    </SelectField>
  )
}

RevokedSelectField.propTypes = {
  allItemText: PropTypes.string,
  intl: intlShape.isRequired,
  onRevokedChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

RevokedSelectField.defaultProps = {
  allItemText: 'All',
  value: '',
}

export default injectIntl(RevokedSelectField)

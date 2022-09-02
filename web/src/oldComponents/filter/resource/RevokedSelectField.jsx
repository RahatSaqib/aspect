import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { injectIntl, defineMessages } from 'react-intl'
import PropTypeOf from '../../../utils/types'
import SelectField from '../../shared/SelectField'

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
  const restProps = omit(props, ['allItemText', 'value', 'onRevokedChange'])

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      <MenuItem value="0">{props.intl.formatMessage(messages.optionFalse)}</MenuItem>
      <MenuItem value="1">{props.intl.formatMessage(messages.optionTrue)}</MenuItem>
    </SelectField>
  )
}

RevokedSelectField.propTypes = {
  allItemText: PropTypes.string,
  intl: PropTypeOf.intl.isRequired,
  onRevokedChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

RevokedSelectField.defaultProps = {
  allItemText: 'All',
  value: '',
}

export default injectIntl(RevokedSelectField)

import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { injectIntl, defineMessages } from 'react-intl'
import PropTypeOf from '../../../utils/types'
import SelectField from '../../shared/SelectField'

const messages = defineMessages({
  optionActual: {
    id: 'pages.displayResultSelectField.Actual',
    defaultMessage: 'Actual',
  },
  optionExcluded: {
    id: 'pages.displayResultSelectField.Excluded',
    defaultMessage: 'Excluded',
  },
})
const DisplayResultSelectField = props => {
  const handleChange = ({ target: { value } }) => {
    props.onDisplayResultChange(value === 'all' ? undefined : value)
  }

  const { allItemText } = props
  const value = props.value || 'all'
  const restProps = omit(props, ['allItemText', 'value', 'onDisplayResultChange'])

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      <MenuItem value="actual">{props.intl.formatMessage(messages.optionActual)}</MenuItem>
      <MenuItem value="excluded">{props.intl.formatMessage(messages.optionExcluded)}</MenuItem>
    </SelectField>
  )
}

DisplayResultSelectField.propTypes = {
  allItemText: PropTypes.string,
  intl: PropTypeOf.intl.isRequired,
  onDisplayResultChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

DisplayResultSelectField.defaultProps = {
  allItemText: 'All',
  value: '',
}

export default injectIntl(DisplayResultSelectField)

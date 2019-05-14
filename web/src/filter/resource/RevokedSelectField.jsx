// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'

const RevokedSelectField = props => {
  const handleChange = ({ target: { value } }) => {
    props.onRevokedChange(value === 'all' ? undefined : value)
  }

  const { allItemText, value } = props
  const restProps = _.omit(props, ['allItemText', 'value'])
  const revokedOptions = [
    {
      id: 0,
      name: 'false',
    },
    {
      id: 1,
      name: 'true',
    },
  ]

  return (
    <SelectField {...restProps} value={value} onChange={handleChange}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {revokedOptions.map(option => (
        <MenuItem key={option.id} value={option.id}>
          {option.name}
        </MenuItem>
      ))}
    </SelectField>
  )
}

RevokedSelectField.propTypes = {
  allItemText: PropTypes.string,
  fetchAssays: PropTypes.func.isRequired,
  onRevokedChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

RevokedSelectField.defaultProps = {
  allItemText: 'All',
  value: '',
}

export default RevokedSelectField

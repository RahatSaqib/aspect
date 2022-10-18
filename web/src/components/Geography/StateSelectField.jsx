import React from 'react'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import PropTypes from 'prop-types'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'

const StateSelectField = ({ allItemText, countryId, stateId, onStateIdChange, floatingLabelText }) => {
  const { isLoading: isStateLoading, data: states } = useStatesByCountry(countryId, { enabled: !!countryId })

  const handleSelectFieldChange = ({ target: { value } }) => {
    onStateIdChange(value === 'all' ? undefined : { id: value, name: states.find(s => s.id === value).name })
  }

  return isStateLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      select
      variant="standard"
      value={stateId}
      onChange={handleSelectFieldChange}
      label={floatingLabelText}
      style={{ width: '98%', margin: '0 1%' }}
    >
      {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
      {(states || []).map(s => (
        <MenuItem key={s.id} value={s.id}>
          {s.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default StateSelectField

StateSelectField.propTypes = {
  allItemText: PropTypes.string,
  onStateIdChange: PropTypes.func,
  countryId: PropTypes.string,
  stateId: PropTypes.string,
  floatingLabelText: PropTypes.string.isRequired,
}

StateSelectField.defaultProps = {
  allItemText: null,
  onStateIdChange: () => {},
  countryId: '',
  stateId: '',
}

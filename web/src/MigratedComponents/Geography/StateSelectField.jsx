import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import LinearProgress from '@material-ui/core/LinearProgress'
import TextField from '@material-ui/core/TextField'
import useStatesByCountry from '../../Hooks/geography/useStatesByCountry'

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
      labelId={floatingLabelText}
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

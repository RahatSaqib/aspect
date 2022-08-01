import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import LinearProgress from '@material-ui/core/LinearProgress'
import Select from '@material-ui/core/Select'
import InputLabel from '@material-ui/core/InputLabel'
import useStatesByCountry from '../../Hooks/geography/useStatesByCountry'

const StateSelectField = ({ allItemText, countryId, stateId, onStateIdChange, floatingLabelText }) => {
  const { isLoading: isStateLoading, data: states } = useStatesByCountry(countryId, { enabled: !!countryId })

  const handleSelectFieldChange = ({ target: { value } }) => {
    onStateIdChange(value === 'all' ? undefined : { id: value, name: states.find(s => s.id === value).name })
  }

  return isStateLoading ? (
    <LinearProgress />
  ) : (
    <>
      <InputLabel id={floatingLabelText}>{floatingLabelText}</InputLabel>
      <Select
        variant="standard"
        value={stateId}
        onChange={handleSelectFieldChange}
        labelId={floatingLabelText}
        style={{ width: '98%' }}
      >
        {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
        {(states || []).map(s => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </Select>
    </>
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

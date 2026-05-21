import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import useCountries from '../../hooks/geography/useCountries'

const CountrySelectField = ({ allItemText, countryId, onCountryIdChange, floatingLabelText, error, helperText }) => {
  const { isLoading: isCountryLoading, data: countries } = useCountries()

  const handleSelectFieldChange = ({ target: { value } }) => {
    onCountryIdChange(value === 'all' ? undefined : { id: value, name: countries.find(s => s.id === value).name })
  }

  return isCountryLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      error={error}
      helperText={error ? helperText : null}
      select
      variant="standard"
      value={countryId}
      onChange={handleSelectFieldChange}
      label={floatingLabelText}
      style={{ width: '98%', margin: '0' }}
    >
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {(countries || []).map(c => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default CountrySelectField

CountrySelectField.propTypes = {
  allItemText: PropTypes.string,
  onCountryIdChange: PropTypes.func,
  countryId: PropTypes.number,
  floatingLabelText: PropTypes.string.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
}

CountrySelectField.defaultProps = {
  allItemText: null,
  onCountryIdChange: () => {},
  countryId: null,
  error: false,
  helperText: null,
}

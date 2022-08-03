import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import LinearProgress from '@material-ui/core/LinearProgress'
import TextField from '@material-ui/core/TextField'
import useCountries from '../../Hooks/geography/useCountries'

const CountrySelectField = ({ allItemText, countryId, onCountryIdChange, floatingLabelText }) => {
  const { isLoading: isCountryLoading, data: countries } = useCountries()

  const handleSelectFieldChange = ({ target: { value } }) => {
    onCountryIdChange(value === 'all' ? undefined : { id: value, name: countries.find(s => s.id === value).name })
  }

  return isCountryLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      select
      variant="standard"
      value={countryId}
      onChange={handleSelectFieldChange}
      label={floatingLabelText}
      style={{ width: '98%', margin: '0 1%' }}
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
  countryId: PropTypes.string,
  floatingLabelText: PropTypes.string.isRequired,
}

CountrySelectField.defaultProps = {
  allItemText: null,
  onCountryIdChange: () => {},
  countryId: '',
}

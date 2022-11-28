import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import Flags from 'country-flag-icons/react/3x2'
import useCountries from '../../hooks/geography/useCountries'

// the Flags from country-flag-icons are used to keep it consistent with the flags from the MuiPhoneNumber component
const CountrySelect = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { isLoading: isCountryLoading, data: countries } = useCountries()

  return isCountryLoading ? (
    <LinearProgress />
  ) : (
    <>
      <TextField
        id={id}
        name={name}
        label={label}
        error={error}
        helperText={helperText}
        select
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {countries.map(c => {
          const CurrrentFlag = Flags[c.abbreviation]

          return (
            <MenuItem key={c.id} value={c.id}>
              <CurrrentFlag style={{ height: 20, marginRight: 10, float: 'left' }} />{' '}
              <p style={{ float: 'left' }}>{c.name}</p>
            </MenuItem>
          )
        })}
      </TextField>
    </>
  )
}

export default CountrySelect

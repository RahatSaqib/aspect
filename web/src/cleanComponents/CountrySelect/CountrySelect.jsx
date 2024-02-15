import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import Flags from 'country-flag-icons/react/3x2'
import useCountries from '../../hooks/geography/useCountries'
import COUNTRY_ISO_MAPPING from '../../utils/consts/Countries/CONSTS'

// the Flags from country-flag-icons are used to keep it consistent with the flags from the MuiPhoneNumber component
const CountrySelect = ({ id, name, label, value, onChange, error, helperText, disabled, returnAll }) => {
  const { isLoading: isCountryLoading, data: countries } = useCountries(returnAll)

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
        SelectProps={{ IconComponent: () => null }}
        InputProps={{
          endAdornment: (
            <IconButton
              sx={{ visibility: value ? 'visible' : 'hidden' }}
              onClick={() => onChange({ target: { name, value: null } })}
              disabled={disabled}
            >
              <ClearIcon />
            </IconButton>
          ),
        }}
      >
        {countries.map(c => {
          const CurrentFlag = Flags[COUNTRY_ISO_MAPPING[c.a3]]
          return (
            <MenuItem key={c.id} value={c.id}>
              {CurrentFlag ? (
                <>
                  <CurrentFlag style={{ height: 20, marginRight: 10, float: 'left' }} />{' '}
                </>
              ) : null}
              <p style={{ float: 'left', margin: 0 }}>{c.name}</p>
            </MenuItem>
          )
        })}
      </TextField>
    </>
  )
}

export default CountrySelect

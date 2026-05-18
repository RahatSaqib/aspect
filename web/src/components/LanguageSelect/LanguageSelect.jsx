import React from 'react'
import { TextField, InputAdornment } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Flags from 'country-flag-icons/react/3x2'
import languages from './languages'

// the Flags from country-flag-icons are used to keep it consistent with the flags from the MuiPhoneNumber component
const LanguageSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const currentLang = languages.find(l => l.culture === value)
  const SelectedFlag = currentLang ? Flags[currentLang.isoAlpha2Code.toUpperCase()] : () => <span />

  return (
    <Autocomplete
      id={id}
      value={value}
      name={name}
      options={languages}
      disableClearable
      getOptionLabel={option =>
        option.languageName ? option.languageName : languages.find(l => l.culture === option)?.languageName
      }
      isOptionEqualToValue={(o, val) => o.culture === (val.culture || val)}
      onChange={(e, value) => onChange({ target: { name, value: value.culture } })}
      renderInput={params => (
        <TextField
          fullWidth
          error={error}
          helperText={helperText}
          label={label}
          name={name}
          {...params}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <SelectedFlag style={{ height: 20 }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const FlagComponent = Flags[option.isoAlpha2Code.toUpperCase()]

        return (
          <div {...props} value={option.culture}>
            <FlagComponent style={{ height: 20 }} />
            &nbsp; {option.languageName}
          </div>
        )
      }}
    />
  )
}

export default LanguageSelect

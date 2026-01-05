import * as React from 'react'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

const filter = createFilterOptions()
const ContactTagSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  return (
    <Autocomplete
      value={value}
      multiple
      name={name}
      onChange={(e, value) => onChange({ target: { name, value } })}
      filterOptions={(options, params) => {
        const filtered = filter(options, params)
        const { inputValue } = params
        const isExisting = options.some(option => inputValue === option)
        if (inputValue !== '' && !isExisting) {
          filtered.push(inputValue)
        }
        return filtered
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      options={value}
      renderOption={(props, option) => <li {...props}>{option}</li>}
      freeSolo
      renderInput={params => (
        <TextField
          id={id}
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          InputLabelProps={{ shrink: true }}
        />
      )}
    />
  )
}
export default ContactTagSelect

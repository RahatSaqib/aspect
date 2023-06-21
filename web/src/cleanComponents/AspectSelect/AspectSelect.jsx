import React from 'react'
import { Autocomplete, LinearProgress, TextField } from '@mui/material'

export default function AspectSelect(props) {
  const { label, itemToString, onChange, isLoading, valueBy, value, error, options, ...rest } = props

  if (isLoading) return <LinearProgress />

  return (
    <Autocomplete
      {...rest}
      onChange={(_, newValue) => onChange(valueBy ? newValue?.[valueBy] : newValue)}
      getOptionLabel={itemToString}
      renderInput={params => (
        <TextField
          {...params}
          error={!!error}
          InputLabelProps={{ shrink: true }}
          helperText={error}
          variant="standard"
          label={label}
        />
      )}
      options={options}
      disabled={!options?.length}
      value={valueBy ? options?.find(option => option[valueBy] === value) : value}
    />
  )
}

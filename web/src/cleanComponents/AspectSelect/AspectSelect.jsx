import React from 'react'
import { Autocomplete, LinearProgress, TextField } from '@mui/material'

export default function AspectSelect(props) {
  const { label, itemToString, onChange, isLoading, valueBy, value, options, ...rest } = props

  if (isLoading) return <LinearProgress />

  return (
    <Autocomplete
      {...rest}
      onChange={(_, newValue) => onChange(valueBy ? newValue?.[valueBy] : newValue)}
      getOptionLabel={itemToString}
      renderInput={params => <TextField {...params} variant="standard" label={label} />}
      options={options}
      disabled={!!options?.length}
      value={valueBy ? options?.find(option => option[valueBy] === value) : value}
    />
  )
}

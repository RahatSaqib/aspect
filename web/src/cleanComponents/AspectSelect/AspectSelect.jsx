import React from 'react'
import { Autocomplete, LinearProgress, TextField } from '@mui/material'
import get from 'lodash/get'
import map from 'lodash/map'

export default function AspectSelect(props) {
  const { label, itemToString, onChange, isLoading, valueBy, multiple, error, options, ...rest } = props

  if (isLoading) return <LinearProgress />

  return (
    <Autocomplete
      getOptionLabel={i => {
        if (valueBy && !get(i, valueBy)) i = options.find(o => o[valueBy] === i)
        return itemToString(i)
      }}
      isOptionEqualToValue={valueBy ? (option, value) => option[valueBy] === value : undefined}
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
      multiple={multiple}
      disabled={!options?.length}
      {...rest}
      onChange={(_, newValue) =>
        onChange(valueBy ? (multiple ? map(newValue, i => get(i, valueBy, i)) : newValue?.[valueBy]) : newValue)
      }
    />
  )
}

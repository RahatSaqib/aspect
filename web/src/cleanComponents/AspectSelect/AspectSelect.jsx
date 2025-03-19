import React from 'react'
import { Autocomplete, LinearProgress, TextField } from '@mui/material'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import map from 'lodash/map'

export default function AspectSelect(props) {
  const {
    label,
    itemToString,
    value,
    onChange,
    isLoading,
    valueBy,
    multiple,
    error,
    options,
    placeholder,
    floatingLabelClasses,
    floatingHelperTextProps,
    ...rest
  } = props

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
          placeholder={placeholder}
          InputLabelProps={{
            shrink: true,
            classes: floatingLabelClasses,
          }}
          FormHelperTextProps={floatingHelperTextProps}
          helperText={error}
          variant="standard"
          label={label}
        />
      )}
      value={multiple && !isArray(value) ? [value] : value}
      options={options}
      multiple={multiple}
      disabled={!options?.length}
      {...rest}
      onChange={(_, newValue) => {
        const value = valueBy ? (multiple ? map(newValue, i => get(i, valueBy, i)) : newValue?.[valueBy]) : newValue
        return onChange(value, options)
      }}
    />
  )
}

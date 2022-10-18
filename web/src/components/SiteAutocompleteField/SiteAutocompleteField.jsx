import React, { useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../QueryFetch'
import { SITE_ALL } from '../QueryFetch/Site/index'

const SiteAutoCompleteField = ({
  name,
  value,
  onChange,
  floatingLabelFixed,
  floatingLabelText,
  hintText,
  disableClearable,
  errorText,
  width,
}) => {
  const [selectedValue, setSelectedValue] = useState(value === '' ? undefined : value)
  const { isLoading, data: { data: siteData } = false } = useQuery([SITE_ALL.KEY], async () =>
    fetchWrapperForQueries({ endpoint: SITE_ALL.ENDPOINT })
  )

  const onSelect = (_, value, reason) => {
    if (reason === 'clear') {
      onChange({ name: undefined })
    } else {
      setSelectedValue(value)
      onChange(value)
    }
  }

  return siteData ? (
    <Autocomplete
      name={name}
      isOptionEqualToValue={(o, val) => o.name === (val.name || val) || o.id === (val.id || val)}
      getOptionLabel={option => option.name ?? option}
      disableClearable={disableClearable}
      filterOptions={(options, state) =>
        options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()))
      }
      value={
        selectedValue && !Number.isNaN(parseInt(selectedValue, 10))
          ? siteData.find(e => e.id === selectedValue).name
          : selectedValue
      }
      loading={isLoading}
      fullWidth
      options={siteData || []}
      onChange={onSelect}
      renderInput={params => (
        <TextField
          {...params}
          label={floatingLabelText}
          placeholder={hintText}
          InputLabelProps={{ shrink: floatingLabelFixed }}
          variant="standard"
          style={{ width }}
          error={!!errorText}
          helperText={errorText}
        />
      )}
    />
  ) : null
}

export default SiteAutoCompleteField

SiteAutoCompleteField.defaultProps = {
  name: undefined,
  value: undefined,
  onChange: () => {},
  floatingLabelFixed: false,
  floatingLabelText: '',
  hintText: '',
  disableClearable: false,
  errorText: undefined,
  width: 250,
}
SiteAutoCompleteField.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  floatingLabelFixed: PropTypes.bool,
  floatingLabelText: PropTypes.string,
  hintText: PropTypes.string,
  disableClearable: PropTypes.bool,
  errorText: PropTypes.string,
  width: PropTypes.number || PropTypes.string,
}

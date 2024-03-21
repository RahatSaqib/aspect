import React, { useCallback, useMemo } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import isNumber from 'lodash/isNumber'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../QueryFetch'
import { SITE_ALL } from '../QueryFetch/Site/index'

const SiteAutoCompleteField = ({
  name,
  value, // <-- this is either a string (siteName) or number (siteId)
  onChange,
  floatingLabelFixed,
  floatingLabelText,
  hintText,
  disableClearable,
  errorText,
  width,
  stateId,
  lgaId,
}) => {
  /**
   * 1. get list of all sites
   */
  const { isLoading, data: { data: siteData } = false } = useQuery([SITE_ALL.KEY], async () =>
    fetchWrapperForQueries({ endpoint: SITE_ALL.ENDPOINT })
  )

  /**
   * 2. filtered by stateId/lgaId list of sites
   */
  const options = useMemo(
    () => siteData?.filter(o => (!stateId || stateId === o.stateId) && (!lgaId || lgaId === o.lgaId)),
    [siteData, stateId, lgaId]
  )

  /**
   * 3. Based on value of `value` - find actual object to set it as `selectedValue`.
   * Notice that we work in `controlled` mode, i.e. value is not `undefined` but
   * is either `null` or some actual object
   */
  const selectedValue = useMemo(() => {
    let v
    if (isNumber(v)) {
      v = options?.find(e => e.id === value)
    } else {
      v = options?.find(e => e.name === value)
    }
    return v || null
  }, [value, options])

  /**
   * event handler - changed value returns back to this component via prop `value` and then it changes
   * memoized variable `selectedValue` which then is used in `value={selectedValue}` in return jsx below
   */
  const onSelect = useCallback(
    (_, value, reason) => {
      onChange(reason === 'clear' ? { name: undefined } : value)
    },
    [onChange]
  )

  return siteData ? (
    <Autocomplete
      name={name}
      isOptionEqualToValue={(o, val) => o.name === (val?.name || val) || o.id === (val?.id || val)}
      getOptionLabel={option => option.name ?? option}
      disableClearable={disableClearable}
      filterOptions={(options, state) =>
        options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()))
      }
      value={selectedValue}
      loading={isLoading}
      fullWidth
      options={options}
      onChange={onSelect}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {option.name}
        </li>
      )}
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
  stateId: undefined,
  lgaId: undefined,
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
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  stateId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lgaId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

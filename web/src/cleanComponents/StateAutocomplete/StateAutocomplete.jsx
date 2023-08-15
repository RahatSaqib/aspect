import React from 'react'
import { LinearProgress, TextField } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'

const StateAutocomplete = ({ label, countryId, ...rest }) => {
  const { isLoading: isStateLoading, data: states } = useStatesByCountry({ countryId }, { enabled: !!countryId })

  return isStateLoading ? (
    <LinearProgress />
  ) : (
    <Autocomplete
      multiple
      disabled={!states?.length}
      options={states}
      getOptionLabel={option => option.name}
      renderInput={params => <TextField {...params} variant="standard" label={label} placeholder="States" />}
      {...rest}
    />
  )
}

export default StateAutocomplete

import React, { useState } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { FormControl, InputLabel, MenuItem, Select, IconButton } from '@mui/material'
import Loading from '../../../components/Loading'
import useStatesByCountry from '../../../hooks/geography/useStatesByCountry'
import { useAuthState } from '../../../providers/AuthProvider'

const StateSelector = ({ onChange }) => {
  const { countryId } = useAuthState()
  const { data, isLoading } = useStatesByCountry(countryId)
  const [innerValue, setInnerValue] = useState('')

  const manageValue = val => {
    if (val) {
      setInnerValue(val)
      onChange({ stateId: `${val}` })
    } else {
      setInnerValue('')
      onChange(undefined)
    }
  }

  return isLoading ? (
    <Loading />
  ) : (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      {innerValue === '' ? <InputLabel id="select-state">State</InputLabel> : null}
      <Select
        labelId="select-state"
        label={innerValue !== '' ? 'State' : ''}
        value={innerValue}
        onChange={e => manageValue(e.target.value)}
        displayEmpty
        sx={{ '&.Mui-focused .MuiIconButton-root': { color: 'primary.main' } }}
        endAdornment={
          <IconButton
            sx={{
              marginRight: '15px',
              visibility: innerValue !== '' ? 'visible' : 'hidden',
            }}
            onClick={() => manageValue(undefined)}
          >
            <ClearIcon />
          </IconButton>
        }
      >
        {data.map(o => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default StateSelector

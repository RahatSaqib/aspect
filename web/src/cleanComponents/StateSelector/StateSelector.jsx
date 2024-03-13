import React, { useEffect, useState } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { FormControl, InputLabel, MenuItem, Select, IconButton } from '@mui/material'
import { useIntl } from 'react-intl'
import { Loading } from '..'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage, commonDefinitions as messages } from '../../messages'

const StateSelector = ({ filter, onChange }) => {
  const { countryId } = useAuthState()
  const { data, isLoading } = useStatesByCountry({ countryId })
  const [innerValue, setInnerValue] = useState('')
  const user = useAuthState()
  const { formatMessage } = useIntl()

  useEffect(() => {
    setInnerValue(filter?.stateId ?? '')
  }, [filter])

  const manageValue = val => {
    if (val) {
      setInnerValue(val)
      onChange({ stateId: `${val}` })
    } else {
      setInnerValue(undefined)
      onChange(undefined)
    }
  }

  return isLoading ? (
    <Loading />
  ) : (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      {innerValue === undefined ? (
        <InputLabel id="select-state">{getCustomMessage(formatMessage, messages, 'state', user)}</InputLabel>
      ) : null}
      <Select
        labelId="select-state"
        label={innerValue !== undefined ? getCustomMessage(formatMessage, messages, 'state', user) : ''}
        value={innerValue}
        onChange={e => manageValue(e.target.value)}
        displayEmpty
        sx={{ '&.Mui-focused .MuiIconButton-root': { color: 'primary.main', maxWidth: 100 } }}
        endAdornment={
          <IconButton
            sx={{ marginRight: '15px', visibility: innerValue !== undefined ? 'visible' : 'hidden' }}
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

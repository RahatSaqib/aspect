import React, { useState } from 'react'
import { Grid, TextField } from '@mui/material'
import { useLocation } from 'react-router'
import useI18n from '../../hooks/useI18n'
import messages from '../../messages/FilterMessages'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import FilterContainer from './FilterContainer'

const NotificationFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.notificationName)}
            value={state.notificationName || ''}
            onChange={e => setState({ ...state, notificationName: e.target.value })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default NotificationFilter

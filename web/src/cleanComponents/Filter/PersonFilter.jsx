import React, { useState } from 'react'
import { Grid, TextField } from '@mui/material'
import { useLocation } from 'react-router'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { StateSelect, LgaSelect, ContactStatusSelect } from '../index'
import FilterContainer from './FilterContainer'

const PersonFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <StateSelect
            label={getCustomMessage(messages, 'state', user)}
            value={state.stateId}
            onChange={e => setState({ ...state, stateId: e.target.value, lgaId: null, siteName: null })}
            countryId={state.countryId}
          />
        </Grid>
        <Grid item xs={3}>
          <LgaSelect
            label={getCustomMessage(messages, 'lga', user)}
            value={state.lgaId}
            onChange={e => setState({ ...state, lgaId: e.target.value, siteName: null })}
            stateId={state.stateId}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.contactNameEmail)}
            value={state.contactNameOrEmail || ''}
            onChange={e => setState({ ...state, contactNameOrEmail: e.target.value ? e.target.value : null })}
          />
        </Grid>
        <Grid item xs={3}>
          <ContactStatusSelect
            label={formatMessage(messages.contactStatus)}
            value={`${state.contactStatus}`}
            onChange={e => setState({ ...state, contactStatus: e.target.value })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default PersonFilter

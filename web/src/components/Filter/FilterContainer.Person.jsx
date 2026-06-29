import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, ContactStatusSelect } from '../index'
import FilterContainer from './FilterContainer'

const PersonFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StateSelect
            label={getCustomMessage(formatMessage, messages, 'state', user)}
            value={state.stateId}
            onChange={e => setState({ ...state, stateId: e.target.value, lgaId: null, siteName: null })}
            countryId={state.countryId}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LgaSelect
            label={getCustomMessage(formatMessage, messages, 'lga', user)}
            value={state.lgaId}
            onChange={e => setState({ ...state, lgaId: e.target.value, siteName: null })}
            stateId={state.stateId}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.contactNameEmail)}
            value={state.contactNameOrEmail || ''}
            onChange={e => setState({ ...state, contactNameOrEmail: e.target.value ? e.target.value : null })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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

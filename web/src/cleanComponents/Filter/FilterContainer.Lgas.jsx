import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect } from '../index'
import FilterContainer from './FilterContainer'

const LgasFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <StateSelect
            label={getCustomMessage(formatMessage, messages, 'state', user)}
            value={state.stateId}
            onChange={e => setState({ ...state, stateId: e.target.value })}
            countryId={state.countryId}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={getCustomMessage(formatMessage, messages, 'lga', user)}
            value={state.lgaName || ''}
            onChange={e => setState({ ...state, lgaName: e.target.value ? e.target.value : null })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default LgasFilter

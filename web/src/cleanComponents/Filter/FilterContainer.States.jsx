import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import FilterContainer from './FilterContainer'

const StatesFilter = () => {
  const { formatMessage } = useIntl()
  const [state, setState] = useFilterSync()
  const user = useAuthState()

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TextField
            label={getCustomMessage(formatMessage, messages, 'state', user)}
            value={state.stateName || ''}
            onChange={e => setState({ ...state, stateName: e.target.value ? e.target.value : null })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default StatesFilter

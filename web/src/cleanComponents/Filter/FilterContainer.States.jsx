import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useFilterSync from '../../hooks/useFilterSync'
import messages from '../../messages/FilterMessages'
import FilterContainer from './FilterContainer'
import { getCustomMessage } from '../../messages'
import useAuthState from '../../hooks/useAuthState'

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

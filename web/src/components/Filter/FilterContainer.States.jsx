import React from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect } from '../index'
import FilterContainer from './FilterContainer'

const StatesFilter = () => {
  const { formatMessage } = useIntl()
  const [state, setState] = useFilterSync()
  const user = useAuthState()

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StateSelect
            label={getCustomMessage(formatMessage, messages, 'state', user)}
            value={state.stateId || ''}
            onChange={e => setState({ ...state, stateId: e.target.value })}
            countryId={state.countryId}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default StatesFilter

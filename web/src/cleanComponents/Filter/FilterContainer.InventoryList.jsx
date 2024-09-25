import React from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, ConsumableSelect } from '../index'
import FilterContainer from './FilterContainer'

const InventoryListFilter = () => {
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
            onChange={e => setState({ ...state, stateId: e.target.value, lgaId: null, siteName: null })}
            countryId={state.countryId}
          />
        </Grid>
        <Grid item xs={3}>
          <LgaSelect
            label={getCustomMessage(formatMessage, messages, 'lga', user)}
            value={state.lgaId}
            onChange={e => setState({ ...state, lgaId: e.target.value, siteName: null })}
            stateId={state.stateId}
          />
        </Grid>
        <Grid item xs={3}>
          <SiteAutoCompleteField
            name="site"
            value={state.site || ''}
            onChange={site => setState({ ...state, site: site.name })}
            floatingLabelFixed
            floatingLabelText={formatMessage(messages.site)}
            stateId={state.stateId}
            lgaId={state.lgaId}
            width="100%"
          />
        </Grid>
        <Grid item xs={3}>
          <ConsumableSelect
            valueBy="id"
            label={formatMessage(messages.consumable)}
            value={state.consumableId}
            onChange={value => setState({ ...state, consumableId: value })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default InventoryListFilter

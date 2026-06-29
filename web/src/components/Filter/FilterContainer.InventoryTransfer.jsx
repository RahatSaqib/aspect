import React from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, ConsumableSelect, PeriodSelector } from '../index'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import FilterContainer from './FilterContainer'

const InventoryTransferFilter = props => {
  const { disabled } = props
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  return (
    <FilterContainer state={state} setState={setState} disabled={disabled}>
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
          <SiteAutoCompleteField
            name="originSiteName"
            value={state.originSiteName || ''}
            onChange={site => setState({ ...state, originSiteName: site.name })}
            floatingLabelFixed
            floatingLabelText={formatMessage(messages.originSiteName)}
            stateId={state.stateId}
            lgaId={state.lgaId}
            width="100%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SiteAutoCompleteField
            name="destinationSiteName"
            value={state.destinationSiteName || ''}
            onChange={site => setState({ ...state, destinationSiteName: site.name })}
            floatingLabelFixed
            floatingLabelText={formatMessage(messages.destinationSiteName)}
            stateId={state.stateId}
            lgaId={state.lgaId}
            width="100%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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

export default InventoryTransferFilter

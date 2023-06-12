import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useLocation } from 'react-router'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { StateSelect, LgaSelect, ConsumableSelect, PeriodSelector } from '../index'
import FilterContainer from './FilterContainer'

const InventoryTransferFilter = () => {
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
        <Grid item xs={3}>
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
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

export default InventoryTransferFilter

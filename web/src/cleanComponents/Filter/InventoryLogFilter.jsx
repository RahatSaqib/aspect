import React, { useState } from 'react'
import { Grid, TextField, FormControlLabel, Checkbox } from '@mui/material'
import addYears from 'date-fns/addYears'
import { useLocation } from 'react-router'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { StateSelect, LgaSelect, ConsumableSelect, PeriodSelector } from '../index'
import FilterContainer from './FilterContainer'

const InventoryLogFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  const a = r => isPermittedUser(user.userPermissions, { required: r })

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
          <ConsumableSelect
            label={formatMessage(messages.consumable)}
            value={state.consumableId}
            onChange={e => setState({ ...state, consumableId: e.target.value })}
          />
        </Grid>
        {a(['site:view']) ? (
          <Grid item xs={3}>
            <SiteAutoCompleteField
              name="siteName"
              value={state.siteName || ''}
              onChange={site => setState({ ...state, siteName: site.name })}
              floatingLabelFixed
              floatingLabelText={formatMessage(messages.site)}
              stateId={state.stateId}
              lgaId={state.lgaId}
              width="100%"
            />
          </Grid>
        ) : null}
        <Grid item xs={3}>
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
          />
        </Grid>
        <Grid item xs={3}>
          <PeriodSelector
            label={formatMessage(messages.expirationDate)}
            minDate={state.minExpirationDate || null}
            maxDate={state.maxExpirationDate || null}
            onChange={dv => setState({ ...state, minExpirationDate: dv.minDate, maxExpirationDate: dv.maxDate })}
            customMaxYear={addYears(new Date(), 3)}
            noDay
            noWeek
            noQuarter
            noMonth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.lotNumber)}
            value={state.lotNumber || ''}
            onChange={e => setState({ ...state, lotNumber: e.target.value })}
          />
        </Grid>
        <Grid item xs={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyTransfers)}
                onChange={e => setState({ ...state, onlyTransfers: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.onlyTransfers)}
            sx={{ m: 2 }}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default InventoryLogFilter

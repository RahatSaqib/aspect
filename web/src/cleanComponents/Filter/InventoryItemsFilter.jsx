import React, { useState } from 'react'
import { Grid, TextField, FormControlLabel, Checkbox } from '@mui/material'
import { useLocation } from 'react-router'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { StateSelect, LgaSelect, ConsumableSelect, PeriodSelector, DaysStockLeftSelect } from '../index'
import FilterContainer from './FilterContainer'

const InventoryItemsFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  const allowed = required => isPermittedUser(user.userPermissions, { required })

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
            valueBy="id"
            label={formatMessage(messages.consumable)}
            value={state.consumableId}
            onChange={value => setState({ ...state, consumableId: value })}
          />
        </Grid>
        {allowed(['site:view']) ? (
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
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.breakOutByLot)}
                onChange={e => setState({ ...state, breakOutByLot: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.breakOutByLot)}
            sx={{ m: 2 }}
          />
        </Grid>
        {state.breakOutByLot ? (
          <>
            <Grid item xs={3}>
              <PeriodSelector
                label={formatMessage(messages.expiresOn)}
                minDate={state.minDate || null}
                maxDate={state.maxDate || null}
                onChange={dateValues => setState({ ...state, ...dateValues })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label={formatMessage(messages.lotNumber)}
                value={state.lotNumber || ''}
                onChange={e => setState({ ...state, lotNumber: e.target.value })}
              />
            </Grid>
          </>
        ) : (
          <Grid item xs={3}>
            <DaysStockLeftSelect
              label={formatMessage(messages.daysStockLeft)}
              value={`${state.daysStockLeft}`}
              onChange={e => setState({ ...state, daysStockLeft: e.target.value })}
            />
          </Grid>
        )}
        <Grid item xs={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.hasStock)}
                onChange={e => setState({ ...state, hasStock: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.hasStock)}
            sx={{ m: 2 }}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default InventoryItemsFilter

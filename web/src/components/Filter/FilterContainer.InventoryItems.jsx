import React from 'react'
import { Grid, TextField, FormControlLabel, Checkbox } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, ConsumableSelect, PeriodSelector, DaysStockLeftSelect } from '../index'
import { isPermittedUser } from '../shared/requirePermissions'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import FilterContainer from './FilterContainer'

const InventoryItemsFilter = ({ disabled, breakOutByLot, requireExpirationDate, requireLotNumber }) => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer state={state} setState={setState} disabled={disabled}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <StateSelect
            label={getCustomMessage(formatMessage, messages, 'state', user)}
            value={state.stateId ?? ''}
            onChange={e => setState({ ...state, stateId: e.target.value, lgaId: null, siteName: null })}
            countryId={state.countryId}
          />
        </Grid>
        <Grid item xs={3}>
          <LgaSelect
            label={getCustomMessage(formatMessage, messages, 'lga', user)}
            value={state.lgaId ?? ''}
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
        {breakOutByLot && requireExpirationDate ? (
          <Grid item xs={3}>
            <PeriodSelector
              label={formatMessage(messages.expiresOn)}
              minDate={state.minDate || null}
              maxDate={state.maxDate || null}
              onChange={dateValues => setState({ ...state, ...dateValues })}
            />
          </Grid>
        ) : null}
        {breakOutByLot && requireLotNumber ? (
          <Grid item xs={3}>
            <TextField
              label={formatMessage(messages.lotNumber)}
              value={state.lotNumber || ''}
              onChange={e => setState({ ...state, lotNumber: e.target.value })}
            />
          </Grid>
        ) : null}
        {!breakOutByLot ? (
          <Grid item xs={3}>
            <DaysStockLeftSelect
              label={formatMessage(messages.daysStockLeft)}
              value={`${state.daysStockLeft}`}
              onChange={e => setState({ ...state, daysStockLeft: e.target.value })}
            />
          </Grid>
        ) : null}
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

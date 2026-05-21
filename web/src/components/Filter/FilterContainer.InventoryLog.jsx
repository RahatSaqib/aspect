import React from 'react'
import { Grid, TextField, FormControlLabel, Checkbox } from '@mui/material'
import addYears from 'date-fns/addYears'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, ConsumableSelect, PeriodSelector } from '../index'
import { isPermittedUser } from '../shared/requirePermissions'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import FilterContainer from './FilterContainer'

const InventoryLogFilter = props => {
  const { disabled, requireLotNumber, requireExpirationDate } = props
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer
      state={state}
      setState={setState}
      blocked={['minExpirationDate', 'maxExpirationDate']}
      disabled={disabled}
    >
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
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
          />
        </Grid>
        {requireExpirationDate ? (
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
        ) : null}
        {requireLotNumber ? (
          <Grid item xs={3}>
            <TextField
              label={formatMessage(messages.lotNumber)}
              value={state.lotNumber || ''}
              onChange={e => setState({ ...state, lotNumber: e.target.value ? e.target.value : null })}
            />
          </Grid>
        ) : null}
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

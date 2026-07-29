import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, AssaySelect, PeriodSelector } from '../index'
import { isPermittedUser } from '../shared/requirePermissions'
import FilterContainer from './FilterContainer'

const DeviceWorkloadFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer state={state} setState={setState}>
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
          <AssaySelect
            label={formatMessage(messages.assay)}
            value={state.assayId}
            onChange={e => setState({ ...state, assayId: e.target.value })}
            single
          />
        </Grid>
        {allowed(['device']) ? (
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label={formatMessage(messages.deviceName)}
              value={state.deviceName || ''}
              onChange={e => setState({ ...state, deviceName: e.target.value ? e.target.value : null })}
            />
          </Grid>
        ) : null}
        <Grid item xs={12} sm={6} md={3}>
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default DeviceWorkloadFilter

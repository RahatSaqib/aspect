import React, { useState } from 'react'
import { Grid, TextField } from '@mui/material'
import { useLocation } from 'react-router'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { RevokeSelect, StateSelect } from '../index'
import FilterContainer from './FilterContainer'

const DeviceApiKeyFilter = () => {
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
          <TextField
            label={formatMessage(messages.deviceName)}
            value={state.deviceName || ''}
            onChange={e => setState({ ...state, deviceName: e.target.value ? e.target.value : null })}
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
          <RevokeSelect
            label={formatMessage(messages.revoked)}
            value={state.revoked || ''}
            onChange={e => setState({ ...state, revoked: e.target.value })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default DeviceApiKeyFilter

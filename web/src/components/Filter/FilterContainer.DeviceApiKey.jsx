import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import messages from '../../messages/FilterMessages'
import { RevokeSelect } from '../index'
import { isPermittedUser } from '../shared/requirePermissions'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import FilterContainer from './FilterContainer'

const DeviceApiKeyFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.deviceApiKey)}
            value={state.deviceApiKeyToken || ''}
            onChange={e => setState({ ...state, deviceApiKeyToken: e.target.value || null })}
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
              onChange={site => setState({ ...state, siteName: site?.name || null })}
              floatingLabelFixed
              floatingLabelText={formatMessage(messages.site)}
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

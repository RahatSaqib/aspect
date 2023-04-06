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
import {
  StateSelect,
  LgaSelect,
  AssaySelect,
  DeviceApprovalSelect,
  ConnectorStatusSelect,
  DeviceStatusSelect,
  DeviceTypeSelect,
  DeviceMaintenanceStatusSelect,
} from '../index'
import FilterContainer from './FilterContainer'

const DeviceListFilter = () => {
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
          <AssaySelect
            label={formatMessage(messages.assay)}
            value={state.assayId}
            onChange={e =>
              setState({ ...state, assayId: e.target.value, resultCategoryId: null, resultCategoryGroupId: null })
            }
            onlyResults
          />
        </Grid>
        {a(['device']) ? (
          <Grid item xs={3}>
            <TextField
              label={formatMessage(messages.deviceName)}
              value={state.deviceName || ''}
              onChange={e => setState({ ...state, deviceName: e.target.value })}
            />
          </Grid>
        ) : null}
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
          <DeviceApprovalSelect
            label={formatMessage(messages.deviceApproval)}
            value={state.deviceApprovalId}
            onChange={e => setState({ ...state, deviceApprovalId: e.target.value })}
          />
        </Grid>
        <Grid item xs={3}>
          <ConnectorStatusSelect
            label={formatMessage(messages.connectorStatus)}
            value={state.connectorStatus}
            onChange={e => {
              setState({ ...state, connectorStatus: e.target.value })
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <DeviceStatusSelect
            label={formatMessage(messages.deviceStatus)}
            value={state.deviceMaintenanceStatusId}
            onChange={deviceMaintenanceStatusId => setState({ ...state, deviceMaintenanceStatusId })}
          />
        </Grid>
        <Grid item xs={3}>
          <DeviceTypeSelect
            label={formatMessage(messages.deviceType)}
            value={state.deviceType}
            onChange={deviceType => setState({ ...state, deviceType })}
          />
        </Grid>
        <Grid item xs={3}>
          <DeviceMaintenanceStatusSelect
            label={formatMessage(messages.deviceMaintenanceStatus)}
            value={state.deviceMaintenanceStatusId || []}
            onChange={e => setState({ ...state, deviceMaintenanceStatusId: [...e.target.value] })}
            multiple
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default DeviceListFilter

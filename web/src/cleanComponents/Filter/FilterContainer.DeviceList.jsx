import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import AspectTooltip from '../../oldComponents/shared/AspectTooltip'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import CONSTS from '../../utils/consts/Devices/CONSTS'
import {
  StateSelect,
  LgaSelect,
  AssaySelect,
  DeviceApprovalSelect,
  ConnectorStatusSelect,
  DeviceStatusSelect,
  DeviceTypeSelect,
  DeviceMaintenanceStatusSelect,
  CepheidModulesSelect,
} from '../index'
import FilterContainer from './FilterContainer'

const DeviceListFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer state={state} setState={setState}>
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
          <AssaySelect
            label={formatMessage(messages.assay)}
            value={state.assayId}
            onChange={e =>
              setState({ ...state, assayId: e.target.value, resultCategoryId: null, resultCategoryGroupId: null })
            }
            onlyResults
          />
        </Grid>
        {allowed(['device']) ? (
          <Grid item xs={3}>
            <TextField
              label={formatMessage(messages.deviceName)}
              value={state.deviceName || ''}
              onChange={e => setState({ ...state, deviceName: e.target.value ? e.target.value : null })}
            />
          </Grid>
        ) : null}
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
          <DeviceApprovalSelect
            label={formatMessage(messages.deviceApproval)}
            value={state.deviceApprovalExternalId || []}
            onChange={e => setState({ ...state, deviceApprovalExternalId: [...e.target.value] })}
            multiple
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
        {state.deviceType === CONSTS.GENEXPERT_EXTERNAL_ID ? (
          <Grid item display="flex" gap={1} alignItems="center" flexDirection="row" xs={3}>
            <CepheidModulesSelect
              sx={{ flex: 1 }}
              valueBy="value"
              label={formatMessage(messages.geneXpertType)}
              value={state.geneXpertType ?? null}
              onChange={geneXpertType => setState({ ...state, geneXpertType })}
            />
            <AspectTooltip showHelpIcon title={formatMessage(messages.geneXpertTypeTooltip)} />
          </Grid>
        ) : null}
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

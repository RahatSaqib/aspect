import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import SiteTypeSelect from '../../pages/Site/Detail/Edit/SiteTypeSelect'
import { LgaSelect, SiteListSelect, StateSelect } from '../index'
import FilterContainer from './FilterContainer'

const SiteFilter = props => {
  const { disabled } = props
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

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
          <SiteTypeSelect
            name="siteType"
            label={formatMessage(messages.siteType)}
            value={state.siteTypeId ?? ''}
            onChange={siteTypeId => setState({ ...state, siteTypeId })}
          />
        </Grid>
        <Grid item xs={3}>
          <SiteListSelect
            name="parentWarehouseId"
            label={formatMessage(messages.stockProvider)}
            value={state.parentWarehouseId || ''}
            onChange={parentWarehouseId => setState({ ...state, parentWarehouseId })}
            queryParams={{ siteTypeExternalIds: ['warehouse'], excludeSiteIds: [] }}
            isClearable
          />
        </Grid>
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
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.externalId)}
            value={state.externalId || ''}
            onChange={e => setState({ ...state, externalId: e.target.value ? e.target.value : null })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default SiteFilter

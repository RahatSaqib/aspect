import React from 'react'
import { Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { LgaSelect, PeriodSelector, StateSelect } from '../index'
import FilterContainer from './FilterContainer'

const SampleFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

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
            label={formatMessage(messages.sampleId)}
            value={state.sampleId || ''}
            onChange={e => setState({ ...state, sampleId: e.target.value || null })}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.patientOrResearchId)}
            value={state.patientId || ''}
            onChange={e => setState({ ...state, patientId: e.target.value || null })}
          />
        </Grid>
        <Grid item xs={3}>
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

export default SampleFilter

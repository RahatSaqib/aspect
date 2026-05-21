import React from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, AssaySelect, PeriodSelector } from '../index'
import { isPermittedUser } from '../shared/requirePermissions'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import FilterContainer from './FilterContainer'

const ReporterFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer state={state} setState={setState} blocked={['minDate', 'maxDate']}>
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
        {allowed(['assay:view']) ? (
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
        ) : null}
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

export default ReporterFilter

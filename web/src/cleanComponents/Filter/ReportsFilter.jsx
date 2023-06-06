import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useLocation } from 'react-router'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { StateSelect, LgaSelect, AssaySelect, ConsumableSelect, PeriodSelector, ReportSelector } from '../index'
import FilterContainer from './FilterContainer'

const ReportsFilter = () => {
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
        <Grid item xs={3}>
          <ConsumableSelect
            label={formatMessage(messages.consumable)}
            value={state.consumableId}
            onChange={e => setState({ ...state, consumableId: e.target.value })}
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
        <Grid item xs={3}>
          <ReportSelector
            label={formatMessage(messages.reportName)}
            value={state.reportName}
            onChange={report => setState({ ...state, reportName: report.name })}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default ReportsFilter

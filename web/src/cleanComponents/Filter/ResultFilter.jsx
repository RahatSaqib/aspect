import React, { useState } from 'react'
import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import { useLocation } from 'react-router'
import SiteAutoCompleteField from '../../components/SiteAutocompleteField'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import {
  AssayMultiSelect,
  DeviceTypeSelect,
  DisplayResultSelect,
  LgaSelect,
  PeriodSelector,
  ResultCategoryGroupSelect,
  ResultTreatmentStatusSelect,
  ResultWorkflowStatusSelect,
  StateSelect,
} from '../index'
import FilterContainer from './FilterContainer'

const ResultFilter = () => {
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
        {allowed(['assay:view']) ? (
          <>
            <Grid item xs={3}>
              <AssayMultiSelect
                valueBy="id"
                value={state?.assayId ?? []}
                onChange={val => setState({ ...state, assayId: val, resultCategoryGroupId: null })}
                filters={{
                  hasResults: true,
                }}
              />
            </Grid>

            <Grid item xs={3}>
              <ResultCategoryGroupSelect
                valueBy="externalId"
                label={formatMessage(messages.resultGroup)}
                value={state?.resultCategoryGroupId ?? []}
                onChange={e => setState({ ...state, resultCategoryGroupId: e })}
                assayId={state?.assayId}
              />
            </Grid>
          </>
        ) : null}
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.errorCode)}
            value={state.errorCode || ''}
            onChange={e => setState({ ...state, errorCode: e.target.value ? e.target.value : null })}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.patientOrResearchId)}
            value={state.patientOrResearchId || ''}
            onChange={e => setState({ ...state, patientOrResearchId: e.target.value ? e.target.value : null })}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.sampleId)}
            value={state.sampleId || ''}
            onChange={e => setState({ ...state, sampleId: e.target.value ? e.target.value : null })}
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
          <>
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
              <SiteAutoCompleteField
                name="reportableSiteName"
                value={state.reportableSiteName || ''}
                onChange={site => setState({ ...state, reportableSiteName: site.name, reportableSiteId: site.id })}
                floatingLabelFixed
                floatingLabelText={formatMessage(messages.reportableSite)}
                stateId={state.stateId}
                lgaId={state.lgaId}
                width="100%"
              />
            </Grid>
          </>
        ) : null}
        <Grid item xs={3}>
          <SiteAutoCompleteField
            name="sampleOriginSite"
            value={state.sampleOriginSite || ''}
            onChange={site => setState({ ...state, sampleOriginSite: site.name })}
            floatingLabelFixed
            floatingLabelText={formatMessage(messages.sampleOriginSite)}
            stateId={state.stateId}
            lgaId={state.lgaId}
            width="100%"
          />
        </Grid>
        <Grid item xs={3}>
          <ResultWorkflowStatusSelect
            label={formatMessage(messages.workflowStatus)}
            value={state.workflowStatusId}
            onChange={e => setState({ ...state, workflowStatusId: e.target.value })}
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
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
          />
        </Grid>
        <Grid item xs={3}>
          <ResultTreatmentStatusSelect
            label={formatMessage(messages.treatmentStatus)}
            value={state.treatmentStatus}
            onChange={e => setState({ ...state, treatmentStatus: e.target.value })}
          />
        </Grid>
        <Grid item xs={3}>
          <DisplayResultSelect
            label={formatMessage(messages.displayResult)}
            value={state.displayResult}
            onChange={e => setState({ ...state, displayResult: e.target.value })}
          />
        </Grid>

        {allowed(['site:view']) ? (
          <Grid item xs={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={[true, 'true'].includes(state.onlyReportableResults)}
                  onChange={e => setState({ ...state, onlyReportableResults: e.target.checked || null })}
                />
              }
              label={formatMessage(messages.onlyReportableResults)}
              sx={{ m: 2 }}
            />
          </Grid>
        ) : null}
        <Grid item xs={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyDownloadedByReporter)}
                onChange={e => setState({ ...state, onlyDownloadedByReporter: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.onlyDownloadedByReporter)}
            sx={{ m: 2 }}
          />
        </Grid>
        <Grid item xs={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyTreatmentRequired)}
                onChange={e => setState({ ...state, onlyTreatmentRequired: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.onlyTreatmentRequired)}
            sx={{ m: 2 }}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default ResultFilter

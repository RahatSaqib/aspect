import React from 'react'
import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import isArray from 'lodash/isArray'
import { useIntl } from 'react-intl'
import useAuthState from '../../hooks/useAuthState'
import useFilterSync from '../../hooks/useFilterSync'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import {
  AssayMultiSelect,
  DeviceTypeSelect,
  DisplayResultSelect,
  LgaSelect,
  PeriodSelector,
  ResultCategoryGroupSelect,
  ResultTreatmentStatusSelect,
  StateSelect,
} from '../index'
import { isPermittedUser } from '../shared/requirePermissions'
import SiteAutoCompleteField from '../SiteAutocompleteField'
import FilterContainer from './FilterContainer'

const ResultFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [state, setState] = useFilterSync()

  const allowed = required => isPermittedUser(user.userPermissions, { required })

  return (
    <FilterContainer state={state} setState={setState} blocked={['minDate', 'maxDate']}>
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
        {allowed(['assay:view']) ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <AssayMultiSelect
                valueBy="id"
                value={state?.assayId ?? []}
                onChange={val => setState({ ...state, assayId: val, resultCategoryGroupId: null })}
                filters={
                  ![true, 'true'].includes(state.onlyUnreconciled)
                    ? {
                        hasResults: true,
                      }
                    : undefined
                }
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <ResultCategoryGroupSelect
                valueBy="externalId"
                label={formatMessage(messages.resultGroup)}
                value={state?.resultCategoryGroupId ?? []}
                onChange={e => setState({ ...state, resultCategoryGroupId: e })}
                assayId={!state?.assayId ? [] : !isArray(state?.assayId) ? [state?.assayId] : state?.assayId}
              />
            </Grid>
          </>
        ) : null}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.errorCode)}
            value={state.errorCode || ''}
            onChange={e => setState({ ...state, errorCode: e.target.value ? e.target.value : null })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.patientOrResearchId)}
            value={state.patientOrResearchId || ''}
            onChange={e => setState({ ...state, patientOrResearchId: e.target.value ? e.target.value : null })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.sampleId)}
            value={state.sampleId || ''}
            onChange={e => setState({ ...state, sampleId: e.target.value ? e.target.value : null })}
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
        {allowed(['site:view']) ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <DeviceTypeSelect
            label={formatMessage(messages.deviceType)}
            value={state.deviceType}
            onChange={deviceType => setState({ ...state, deviceType })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PeriodSelector
            noAny
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={({ minDate, maxDate }) => setState({ ...state, minDate, maxDate })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ResultTreatmentStatusSelect
            label={formatMessage(messages.treatmentStatus)}
            value={state.treatmentStatus}
            onChange={e => setState({ ...state, treatmentStatus: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DisplayResultSelect
            label={formatMessage(messages.displayResult)}
            value={state.displayResult}
            onChange={e => setState({ ...state, displayResult: e.target.value })}
          />
        </Grid>
        <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }} />

        {allowed(['site:view']) ? (
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={[true, 'true'].includes(state.onlyReportableResults)}
                  onChange={e => setState({ ...state, onlyReportableResults: e.target.checked || null })}
                />
              }
              label={formatMessage(messages.onlyReportableResults)}
            />
          </Grid>
        ) : null}
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyDownloadedByReporter)}
                onChange={e => setState({ ...state, onlyDownloadedByReporter: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.onlyDownloadedByReporter)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyTreatmentRequired)}
                onChange={e => setState({ ...state, onlyTreatmentRequired: !!e.target.checked })}
              />
            }
            label={formatMessage(messages.onlyTreatmentRequired)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.showDecommissionedDevices)}
                onChange={e => setState({ ...state, showDecommissionedDevices: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.showDecommissionedDevices)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyUnreconciled)}
                onChange={e => setState({ ...state, onlyUnreconciled: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.onlyUnreconciled)}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default ResultFilter

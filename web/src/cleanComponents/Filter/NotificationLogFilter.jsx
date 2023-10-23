import React, { useState } from 'react'
import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import { useLocation } from 'react-router'
import useI18n from '../../hooks/useI18n'
import messages from '../../messages/FilterMessages'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { PeriodSelector } from '../index'
import NotificationCategoryTypeSelect from '../NotificationCategoryTypeSelect'
import NotificationTypeSelect from '../NotificationTypeSelect'
import FilterContainer from './FilterContainer'

const NotificationLogFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <NotificationCategoryTypeSelect
            valueBy="id"
            label={formatMessage(messages.notificationCategoryType)}
            value={state.notificationCategoryTypeId}
            onChange={id => setState(state => ({ ...state, notificationCategoryTypeId: id, notificationTypeId: null }))}
          />
        </Grid>

        <Grid item xs={3}>
          <NotificationTypeSelect
            valueBy="id"
            label={formatMessage(messages.notificationType)}
            categoryTypeId={state.notificationCategoryTypeId}
            value={state.notificationTypeId}
            onChange={id => setState(state => ({ ...state, notificationTypeId: id }))}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.sampleId)}
            value={state.sampleId || ''}
            onChange={({ target: { value } }) => setState({ ...state, sampleId: value ?? null })}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.patientId)}
            value={state.patientId || ''}
            onChange={({ target: { value } }) => setState({ ...state, patientId: value ?? null })}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label={formatMessage(messages.reportWithName)}
            value={state.reportWithName || ''}
            onChange={({ target: { value } }) => setState({ ...state, reportWithName: value ?? null })}
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
          <FormControlLabel
            control={
              <Checkbox
                checked={[true, 'true'].includes(state.onlyErrors)}
                onChange={e => setState({ ...state, onlyErrors: e.target.checked || null })}
              />
            }
            label={formatMessage(messages.onlyErrors)}
            sx={{ m: 2 }}
          />
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default NotificationLogFilter

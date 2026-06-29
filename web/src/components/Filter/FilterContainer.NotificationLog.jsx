import React from 'react'
import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useFilterSync from '../../hooks/useFilterSync'
import messages from '../../messages/FilterMessages'
import { PeriodSelector } from '../index'
import NotificationCategorySelect from '../NotificationCategorySelect'
import NotificationTypeSelect from '../NotificationTypeSelect'
import FilterContainer from './FilterContainer'

const getCategoryType = param => {
  const [value, type] = param?.split('=') ?? ''
  return type === 'category' ? value : null
}

const NotificationLogFilter = () => {
  const { formatMessage } = useIntl()
  const [state, setState] = useFilterSync()

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <NotificationCategorySelect
            valueBy="id"
            label={formatMessage(messages.notificationCategoryType)}
            value={state.notificationCategory || null}
            onChange={id => setState(state => ({ ...state, notificationCategory: id }))}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <NotificationTypeSelect
            valueBy="id"
            label={formatMessage(messages.notificationType)}
            categoryTypeId={getCategoryType(state.notificationCategory)}
            value={state.notificationTypeId || null}
            onChange={id => setState(state => ({ ...state, notificationTypeId: id }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.sampleId)}
            value={state.sampleId || ''}
            onChange={({ target: { value } }) => setState({ ...state, sampleId: value || null })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.patientId)}
            value={state.patientId || ''}
            onChange={({ target: { value } }) => setState({ ...state, patientId: value || null })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label={formatMessage(messages.reportWithName)}
            value={state.reportWithName || ''}
            onChange={({ target: { value } }) => setState({ ...state, reportWithName: value || null })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={state.minDate || null}
            maxDate={state.maxDate || null}
            onChange={dateValues => setState({ ...state, ...dateValues })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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

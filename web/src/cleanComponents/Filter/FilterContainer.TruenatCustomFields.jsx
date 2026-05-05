import React from 'react'
import { Grid, MenuItem, TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import useFilterSync from '../../hooks/useFilterSync'
import messages from '../../messages/FilterMessages'
import { PeriodSelector, SiteSelect } from '../index'
import FilterContainer from './FilterContainer'

const TruenatCustomFieldsFilter = () => {
  const { formatMessage } = useIntl()
  const [state, setState] = useFilterSync()

  return (
    <FilterContainer state={state} setState={setState} blocked={['minDate', 'maxDate']}>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <SiteSelect
            name="siteId"
            label={formatMessage(messages.site)}
            value={state.siteId || ''}
            onChange={e => setState({ ...state, siteId: e.target.value || null })}
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
          <TextField
            label={formatMessage(messages.sampleExternalId)}
            value={state.sampleExternalId || ''}
            onChange={e => setState({ ...state, sampleExternalId: e.target.value || null })}
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            select
            label={formatMessage(messages.matchStatus)}
            value={state.matched ?? ''}
            onChange={e => setState({ ...state, matched: e.target.value === '' ? null : e.target.value })}
            fullWidth
          >
            <MenuItem value="">{formatMessage(messages.all)}</MenuItem>
            <MenuItem value="true">{formatMessage(messages.matched)}</MenuItem>
            <MenuItem value="false">{formatMessage(messages.noMatch)}</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </FilterContainer>
  )
}

export default TruenatCustomFieldsFilter

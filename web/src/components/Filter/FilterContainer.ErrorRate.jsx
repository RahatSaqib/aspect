import React from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import useFilterSync from '../../hooks/useFilterSync'
import messages from '../../messages/FilterMessages'
import { PeriodSelector } from '../index'
import FilterContainer from './FilterContainer'

export default function ErrorRateFilter() {
  const { formatMessage } = useIntl()
  const [state, setState] = useFilterSync()

  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
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

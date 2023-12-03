import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import useAuthState from '../../hooks/useAuthState'
import useFilterValues from '../../hooks/useFilterValues'
import messages from '../../messages/FilterMessages'
import { PeriodSelector } from '../index'
import FilterContainer from './FilterContainer'

export default function ErrorRateFilter() {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })
  return (
    <FilterContainer state={state} setState={setState}>
      <Grid container spacing={2}>
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

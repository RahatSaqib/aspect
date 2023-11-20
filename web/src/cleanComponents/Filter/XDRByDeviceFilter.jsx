import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import useAuthState from '../../hooks/useAuthState'
import useFilterValues from '../../hooks/useFilterValues'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { StateSelect, LgaSelect, PeriodSelector } from '../index'
import FilterContainer from './FilterContainer'

const XDRByDeviceFilter = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)

  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  return (
    <FilterContainer state={state} setState={setState} blocked={['minDate']}>
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

export default XDRByDeviceFilter

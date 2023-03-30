import React, { useState } from 'react'
import { Grid, TextField } from '@mui/material'
import { useLocation } from 'react-router'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/FilterMessages'
import { isPermittedUser } from '../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues } from '../../providers/FilterProvider'
import { StateSelect, LgaSelect, AssaySelect, PeriodSelector } from '../index'
import FilterContainer from './FilterContainer'

const ReporterFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  const a = r => isPermittedUser(user.userPermissions, { required: r })

  return (
    <FilterContainer>
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
        {a(['assay:view']) ? (
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
          <TextField
            label={formatMessage(messages.deviceName)}
            value={state.deviceName || ''}
            onChange={e => setState({ ...state, deviceName: e.target.value })}
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

import React, { useState } from 'react'
import { Button, Card, CardActions, CardContent, Collapse, Grid, TextField } from '@mui/material'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useLocation } from 'react-router'
import FilterButtons from '../../../cleanComponents/FilterButtons/FilterButtons'
import { StateSelect, LgaSelect, AssaySelect, PeriodSelector } from '../../../cleanComponents/index'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages'
import messages from '../../../messages/FilterMessages'
import { isPermittedUser } from '../../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterValues, useFilterUpdate } from '../../../providers/FilterProvider'

const cardContentStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }

const ReporterFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const filter = useFilterValues(location.pathname)
  const [addFilter, removeFilter] = useFilterUpdate()
  const [state, setState] = useState({ ...filter })

  const a = r => isPermittedUser(user.userPermissions, { required: r })

  const toggleOpen = () => setExpanded(state => !state)

  const clear = () => {
    setState({ ...filter })
    toggleOpen()
  }

  const apply = () => {
    addFilter(state, location.pathname)
    toggleOpen()
  }

  const remove = key => removeFilter(key, location.pathname)

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={cardContentStyle}>
        <FilterButtons filters={filter} remove={remove} />
        <Button variant="contained" sx={{ m: 0.25, height: '36px' }} onClick={toggleOpen}>
          {expanded ? <MdArrowUpward /> : <MdArrowDownward />}
        </Button>
      </CardContent>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={cardContentStyle}>
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
        </CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={clear}>
            {formatMessage(messages.cancel)}
          </Button>
          <Button size="small" onClick={apply}>
            {formatMessage(messages.apply)}
          </Button>
        </CardActions>
      </Collapse>
    </Card>
  )
}

export default ReporterFilter

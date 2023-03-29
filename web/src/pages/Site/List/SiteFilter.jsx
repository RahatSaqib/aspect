import React, { useState } from 'react'
import { Button, Card, CardActions, CardContent, Collapse, Grid, TextField } from '@mui/material'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useLocation } from 'react-router'
import FilterButtons from '../../../cleanComponents/FilterButtons/FilterButtons'
import { StateSelect, LgaSelect } from '../../../cleanComponents/index'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages'
import messages from '../../../messages/FilterMessages'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterValues, useFilterUpdate } from '../../../providers/FilterProvider'

const cardContentStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }

const SiteFilter = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const filter = useFilterValues(location.pathname)
  const [addFilter, removeFilter] = useFilterUpdate()
  const [state, setState] = useState({ ...filter })

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
              <TextField
                label={formatMessage(messages.externalId)}
                value={state.externalId || ''}
                onChange={e => setState({ ...state, externalId: e.target.value })}
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

export default SiteFilter

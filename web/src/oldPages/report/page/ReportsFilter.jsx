import React, { useState } from 'react'
import { Button, Card, CardActions, CardContent, Collapse, Grid } from '@mui/material'
import { MdClose, MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useLocation } from 'react-router'
import {
  StateSelect,
  LgaSelect,
  AssaySelect,
  ConsumableSelect,
  PeriodSelector,
  ReportSelector,
} from '../../../cleanComponents/index'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages'
import messages from '../../../messages/FilterMessages'
import { isPermittedUser } from '../../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterValues, useFilterUpdate } from '../../../providers/FilterProvider'

const excluded = ['countryId']

const cardContentStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }

const ReportsFilter = () => {
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

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={cardContentStyle}>
        <span>
          {Object.keys(filter).map(k =>
            !excluded.includes(k) && filter[k] !== null ? (
              <Label l={`${k} ${filter[k]}`} onRemove={() => removeFilter(k, location.pathname)} />
            ) : null
          )}
        </span>
        <Button variant="contained" sx={{ m: 0.25, height: '36px' }}>
          {expanded ? <MdArrowUpward onClick={toggleOpen} /> : <MdArrowDownward onClick={toggleOpen} />}
        </Button>
      </CardContent>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={cardContentStyle}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <StateSelect
                label={getCustomMessage(messages, 'state', user)}
                value={filter.stateId}
                onChange={e => setState({ ...state, stateId: e.target.value, lgaId: null, siteName: null })}
                countryId={filter.countryId}
              />
            </Grid>
            <Grid item xs={3}>
              <LgaSelect
                label={getCustomMessage(messages, 'lga', user)}
                value={filter.lgaId}
                onChange={e => setState({ ...state, lgaId: e.target.value, siteName: null })}
                stateId={filter.stateId}
              />
            </Grid>
            <Grid item xs={3}>
              <AssaySelect
                label={formatMessage(messages.assay)}
                value={filter.assayId}
                onChange={e =>
                  setState({ ...state, assayId: e.target.value, resultCategoryId: null, resultCategoryGroupId: null })
                }
                onlyResults
              />
            </Grid>
            <Grid item xs={3}>
              <ConsumableSelect
                label={formatMessage(messages.consumable)}
                value={filter.consumableId}
                onChange={e => setState({ ...state, consumableId: e.target.value })}
              />
            </Grid>
            {a(['site:view']) ? (
              <Grid item xs={3}>
                <SiteAutoCompleteField
                  name="siteName"
                  value={filter.siteName || ''}
                  onChange={site => setState({ ...state, siteName: site.name })}
                  floatingLabelFixed
                  floatingLabelText={formatMessage(messages.site)}
                  stateId={filter.stateId}
                  lgaId={filter.lgaId}
                  width="100%"
                />
              </Grid>
            ) : null}
            <Grid item xs={3}>
              <PeriodSelector
                label={formatMessage(messages.date)}
                minDate={filter.minDate || null}
                maxDate={filter.maxDate || null}
                onChange={dateValues => setState({ ...state, ...dateValues })}
              />
            </Grid>
            <Grid item xs={3}>
              <ReportSelector
                label={formatMessage(messages.reportName)}
                value={filter.reportName}
                onChange={report => setState({ ...state, reportName: report.name })}
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

export default ReportsFilter

const Label = ({ l, onRemove }) => {
  return (
    <Button color="secondary" variant="contained" sx={{ m: 0.25 }} onClick={onRemove}>
      {l} <MdClose />
    </Button>
  )
}

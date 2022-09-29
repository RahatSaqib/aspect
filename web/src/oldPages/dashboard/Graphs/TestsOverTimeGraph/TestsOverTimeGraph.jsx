import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Chip } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import graphsContainerMessages from '../../../../components/Graphs/GraphsContainer/messages'
import { getTimePeriod } from '../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import assayTranslations from '../../../../messages/assay'
import styles from './styles.css'
import TestsOverTimeGraphMain from './TestsOverTimeGraph.Main'
import TestsOverTimeGraphSide from './TestsOverTimeGraph.Side'

const cssClasses = classnames.bind(styles)

const endPointParams = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const TestsOverTimeGraph = ({ assaysFromState }) => {
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState([])

  useEffect(() => {
    const defaultFilter = assaysFromState.filter(a => a.assayTypeAbbreviation === 'TB')
    setFilter(defaultFilter)
  }, [assaysFromState])

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
  )

  return isLoading || !filter.length ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphsContainerMessages.testsOverTimeTitle)} />
            <CardContent>
              <Grid container spacing={8} className={cssClasses('Graph_Content')}>
                <Grid item xs={12} md={12} lg={3}>
                  <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                    <Grid item xs={12} md={4} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                      <FormControlLabel
                        label={formatMessage(graphsContainerMessages.showValuesLabel)}
                        control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                    <Grid item xs={12} md={8} lg={12} className={cssClasses('Graph_Content_AssaySelector')}>
                      <AssayAutocomplete assaysFromState={assaysFromState} value={filter} onChange={setFilter} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={9}>
                  <Grid container>
                    <TestsOverTimeGraphMain
                      data={data.data}
                      endPointParams={endPointParams}
                      assaysFromState={assaysFromState}
                      showLabel={showLabel}
                      filterSelection={filter}
                    />
                    <TestsOverTimeGraphSide
                      data={data.data}
                      endPointParams={endPointParams}
                      assaysFromState={assaysFromState}
                      showLabel={showLabel}
                      filterSelection={filter}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ErrorBoundary>
  )
}

export default TestsOverTimeGraph

const AssayAutocomplete = ({ assaysFromState, value, onChange }) => {
  const { formatMessage } = useI18n()
  const [innerValue, setInnerValue] = useState(value)

  const options = assaysFromState.sort((a, b) => -b.assayTypeAbbreviation.localeCompare(a.assayTypeAbbreviation))
  const optionAll = { assayTypeAbbreviation: '', i18nKey: 'All' }

  return (
    <Autocomplete
      multiple
      size="small"
      value={innerValue}
      onChange={(event, newValue) => {
        if (newValue.length) {
          const includeAll = newValue.filter(o => o.i18nKey === 'All').length > 0
          if (includeAll) {
            if (newValue[0].i18nKey === 'All') {
              const [, ...rest] = newValue
              setInnerValue(rest)
              onChange(rest)
            } else {
              setInnerValue([optionAll])
              onChange(assaysFromState)
            }
          } else {
            setInnerValue(newValue)
            onChange(newValue)
          }
        } else {
          setInnerValue([optionAll])
          onChange(assaysFromState)
        }
      }}
      options={[optionAll, ...options]}
      groupBy={option => option.assayTypeAbbreviation}
      getOptionLabel={option => formatMessage(assayTranslations[option.i18nKey])}
      sx={{ minWidth: '120px' }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            color="primary"
            label={formatMessage(assayTranslations[option.i18nKey])}
            size="small"
            {...getTagProps({ index })}
          />
        ))
      }
      renderInput={params => <TextField {...params} />}
    />
  )
}

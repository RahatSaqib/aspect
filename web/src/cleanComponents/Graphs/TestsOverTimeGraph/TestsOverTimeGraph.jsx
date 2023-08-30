import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Grid,
  TextField,
} from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import reduce from 'lodash/reduce'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { BarGraph, DonutGraph } from '..'
import {
  getTimePeriod,
  formatDataByGraphType,
  getAverageFromData,
  calcPercentageForGraphs,
  translateLabel as genLabel,
} from '../../../components/Graphs/Helpers/Formatters'
import messages from '../../../components/Graphs/intlMessages'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages, assay } from '../../../messages'
import { negateTimeZoneOffset } from '../../../oldComponents/shared/DateTimeInput/utils/date'
import { useFilterUpdate } from '../../../providers/FilterProvider'
import ErrorBoundary from '../../ErrorBoundary'
import Loading from '../../Loading'
import styles from '../graphStyles.css'

const cssClasses = classnames.bind(styles)

const endPointParams = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const filterFunctionPie = (data, props) => {
  const newData = []
  const keys = []
  map(props, ({ externalId }) => keys.push(externalId))
  map(keys, key => {
    const found = filter(data, { id: key })[0]
    if (!isEmpty(found)) {
      return newData.push(found)
    }
  })
  return newData
}

const filterFunctionBar = (data, props) => {
  const newData = []
  const keys = ['month']
  map(props, ({ externalId }) => keys.push(externalId))
  map(data, row => newData.push(pick(row, keys)))
  return newData
}

const TestsOverTimeGraph = ({ assaysFromState: assays }) => {
  const { formatMessage, format } = useI18n()
  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState([])
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  useEffect(() => {
    const tbAssays = assays.filter(a => a.assayTypeAbbreviation === 'TB')
    const defaultFilter = tbAssays.length > 0 ? tbAssays : assays
    setFilter(defaultFilter)
  }, [assays])

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
  )
  const [donutData, setDonutData] = useState({})
  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && data.data) {
      const info = data.data
      const i18nKeys = reduce(
        info,
        (acc, curr) => {
          acc[curr.assay] = curr.assayI18nKey
          return acc
        },
        {}
      )
      // code for donut
      const groupedForPie = formatDataByGraphType(
        info,
        'percentage',
        false,
        'MMM yy',
        'cnt',
        'assay',
        i18nKeys,
        'pie',
        endPointParams,
        formatMessage,
        messages
      )
      const pieData = filterFunctionPie(groupedForPie, filter)
      const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0)
      const { totals: pieAverage } = getAverageFromData(pieData, 'value', '*', 'standard')
      const pie = pieData.map(d => ({
        ...d,
        label: genLabel(d.id, assays, formatMessage, messages, i18nKeys),
        value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 2),
      }))
      // code for column
      const groupedForBar = formatDataByGraphType(
        info,
        'actual',
        false,
        'MMM',
        'month',
        'assay',
        i18nKeys,
        'bar',
        endPointParams,
        formatMessage,
        messages
      )
      const expandedBarData = []
      filterFunctionBar(groupedForBar, filter).map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month: format(negateTimeZoneOffset(new Date(result.month)), 'MMM-yyyy'),
            value: result[key],
            type: genLabel(key, assays, formatMessage, messages, i18nKeys),
            originalMonth: result.month,
          })
        )
        return result
      })

      setBarData({ data: expandedBarData })
      setDonutData({ data: pie, total: pieAverage })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter])

  return isLoading || !filter.length ? (
    <Loading />
  ) : (
    <ErrorBoundary>
      <Grid container className={cssClasses('Graph_Container')}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={formatMessage(graphMessages.testsOverTimeTitle)} />
            <CardContent>
              <Grid container spacing={1} className={cssClasses('Graph_Content')}>
                <Grid item xs={12} md={12} lg={2}>
                  <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                    <Grid item xs={12} md={4} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
                      <FormControlLabel
                        label={formatMessage(graphMessages.showValuesLabel)}
                        control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                      />
                    </Grid>
                    <Grid item xs={12} md={8} lg={12} className={cssClasses('Graph_Content_AssaySelector')}>
                      <AssayAutocomplete assaysFromState={assays} value={filter} onChange={setFilter} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={12} lg={10}>
                  <Grid container>
                    {barData.data && barData.data.length ? (
                      <Grid item xs={12} md={8}>
                        <BarGraph
                          data={barData.data}
                          graphId="testPerformedMonthlyPercentage"
                          xField="month"
                          legend={false}
                          showLabel={showLabel}
                          onReady={plot => {
                            plot.on('plot:click', evt => {
                              const base = 'yyyy-MM-dd'
                              const parsedDate = negateTimeZoneOffset(new Date(evt.data.data.originalMonth), base)

                              const params = {
                                displayResult: 'actual',
                                maxDate: format(endOfMonth(parsedDate), base),
                                minDate: format(startOfMonth(parsedDate), base),
                                onlyReportableResults: true,
                                assayId: assays.filter(a => a.externalId === evt.data.data.type)[0].id,
                              }
                              addFilter({ ...params }, '/browse/result')
                              navigate('/browse/result')
                            })
                          }}
                        />
                      </Grid>
                    ) : null}
                    {donutData.data && donutData.data.length ? (
                      <Grid item xs={12} md={4} lg={4}>
                        <DonutGraph
                          data={donutData.data}
                          total={donutData.total}
                          graphId="testPerformedMonthlytotal"
                          graphTitle={[
                            formatMessage(graphMessages.testsOverTimeAvgTitle)
                              .split(' ')
                              .splice(
                                0,
                                Math.ceil(formatMessage(graphMessages.testsOverTimeAvgTitle).split(' ').length / 2)
                              )
                              .join(' '),
                            formatMessage(graphMessages.testsOverTimeAvgTitle)
                              .split(' ')
                              .splice(
                                Math.ceil(formatMessage(graphMessages.testsOverTimeAvgTitle).split(' ').length / 2)
                              )
                              .join(' '),
                          ].join('<br/>')} // "Average Monthly<br/>Test Performed"
                          legend={false}
                          showLabel={showLabel}
                        />
                      </Grid>
                    ) : null}
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
      /**
       * because `optionAll` doesn't contain all props as items in `options` and
       * `innerValue` - Autocomplete shows large yellow warning in console,
       * suggesting using below func for equality of `option` and `value` items
       */
      isOptionEqualToValue={(option, value) => option.i18nKey === value.i18nKey}
      groupBy={option => option.assayTypeAbbreviation}
      getOptionLabel={option => formatMessage(assay[option.i18nKey])}
      sx={{ minWidth: '120px', maxWidth: '100%' }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip color="primary" label={formatMessage(assay[option.i18nKey])} size="small" {...getTagProps({ index })} />
        ))
      }
      renderInput={params => <TextField {...params} />}
    />
  )
}

import React, { useState, useEffect, useMemo } from 'react'
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
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { graphMessages, assay } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { formatDataByGraphType, Loading } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import {
  getTimePeriod,
  genLabel,
  calcPercentageForGraphs,
  // getAverageFromData,
  negateTimeZoneOffset,
  getMinMaxDateFromMonthString,
} from '../graphUtils'
import { DonutGraph, ColumnGraph } from '../index'

const endPointParams = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(1, 'months', 'yyyy-MM-dd', true) },
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
  const { formatMessage, format } = useIntl()
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
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams }),
    { ...GRAPHS_QUERY_OPTIONS }
  )

  const { donutData, barData } = useMemo(() => {
    if (!data?.data) return { donutData: {}, barData: {} }

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
    const totalAverage = (pieTotal / 12)?.toFixed(1)
    const pie = pieData.map(d => ({
      ...d,
      label: genLabel(d.id, assays, formatMessage, messages, i18nKeys),
      value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 1),
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
          month:
            formatMessage(messages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
            format(negateTimeZoneOffset(new Date(result.month)), '-yyyy'),
          value: +result[key].toFixed(1),
          type: genLabel(key, assays, formatMessage, messages, i18nKeys),
          originalMonth: result.month,
        })
      )
      return result
    })

    return { donutData: { data: pie, total: `${totalAverage}` }, barData: { data: expandedBarData } }
  }, [data, filter, assays, formatMessage, format])

  return isLoading || !filter.length ? (
    <Loading />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.testsOverTimeTitle)} />
          <CardContent>
            <Grid container spacing={1} className={styles.Graph_Content}>
              <Grid item xs={12} md={12} lg={2}>
                <Grid container spacing={2} className={styles.Graph_Content_Container}>
                  <Grid item xs={12} md={4} lg={12} className={styles.Graph_Content_ShowLabel}>
                    <FormControlLabel
                      label={formatMessage(graphMessages.showValuesLabel)}
                      control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                    />
                  </Grid>
                  <Grid item xs={12} md={8} lg={12} className={styles.Graph_Content_AssaySelector}>
                    <AssayAutocomplete assaysFromState={assays} value={filter} onChange={setFilter} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={10}>
                <Grid container>
                  {barData.data && barData.data.length ? (
                    <Grid item xs={12} md={8}>
                      <ColumnGraph
                        data={barData.data}
                        graphId="testPerformedMonthlyPercentage"
                        xField="month"
                        yField="value"
                        seriesField="type"
                        showLabel={showLabel}
                        onReady={plot => {
                          plot.on('plot:click', evt => {
                            const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)

                            const assay = assays.find(a => a.externalId === evt.data.data.id).id
                            const params = {
                              displayResult: 'actual',
                              minDate,
                              maxDate,
                              assayId: [assay],
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
                            .splice(Math.ceil(formatMessage(graphMessages.testsOverTimeAvgTitle).split(' ').length / 2))
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
  )
}

export default TestsOverTimeGraph

const AssayAutocomplete = ({ assaysFromState, value, onChange }) => {
  const { formatMessage } = useIntl()
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

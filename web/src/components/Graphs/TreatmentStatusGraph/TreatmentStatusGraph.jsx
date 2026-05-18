import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import filter from 'lodash/filter'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { graphMessages } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { formatDataByGraphType, Loading } from '../../index'
import fetchWrapperForQueries from '../../QueryFetch'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'
import {
  prepAssaysForParams,
  calcPercentageForGraphs,
  genLabel,
  prepParamsForEndPoint,
  negateTimeZoneOffset,
  getMinMaxDateFromMonthString,
  getTimePeriod,
} from '../graphUtils'
import { DonutGraph, ColumnGraph } from '../index'

const assays = [
  'abbottM2000DBSHivVL',
  'abbottM2000PlasmaHivVL',
  'assayAlereQHiv12Detect',
  'assayAlereQHiv12VLPlasma',
  'assayCobasHivVl',
  'GxHiv1Vl',
  'QHivVL',
  'ReporterHivVL',
]

const getWhitelistedAssays = ({ assays, assaysFromState }) => {
  const allowed = []
  if (assays && assays.length > 0) {
    assays.map(a =>
      assaysFromState.filter(({ externalId, hasResults }) => externalId === a && hasResults && allowed.push(a))
    )
  }
  return allowed
}

const endPointParams = {
  minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd'),
  maxDate: getTimePeriod(1, 'months', 'yyyy-MM-dd', true),
}

const TreatmentStatusGraph = ({ assaysFromState }) => {
  const { formatMessage, format } = useIntl()
  const [showLabel, setShowLabel] = useState(false)
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const whiteListed = getWhitelistedAssays({ assays, assaysFromState })
  const mergedParams = [
    ...prepAssaysForParams(whiteListed, 'GET'),
    ...prepParamsForEndPoint(
      {
        minDate: startOfMonth(subMonths(new Date(), 12)),
        maxDate: endOfMonth(subMonths(new Date(), 1)),
      },
      false
    ),
  ]
  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/confirmed-treatment-tracking', params: endPointParams }),
    { ...GRAPHS_QUERY_OPTIONS }
  )

  // code for donut
  const [donutData, setDonutData] = useState({})
  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && data.data) {
      const info = data.data
      const i18nKeys = { Confirmed: 'Confirmed', NotConfirmed: 'NotConfirmed' }

      const pieData = formatDataByGraphType(
        info,
        'percentage',
        false,
        'MMM yy',
        'monthTested',
        'onTreatment',
        i18nKeys,
        'pieLegacyTreatment',
        mergedParams,
        formatMessage,
        messages
      )
      const numberOfMonthsInAYear = 12
      const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0)
      const confirmed = pieData.find(elem => elem.id === 'Confirmed') || {}

      const pieAvg = (confirmed.value / numberOfMonthsInAYear).toFixed(1)
      const pie = pieData.map(d => ({
        ...d,
        label: genLabel(d.id, assaysFromState, formatMessage, messages, i18nKeys),
        value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 1),
      }))
      // code for column
      const groupedForBar = formatDataByGraphType(
        info,
        'percentage',
        false,
        'MMM',
        'monthTested',
        'pcOnTreatment',
        i18nKeys,
        'barLegacyTreatment',
        mergedParams,
        formatMessage,
        messages
      )
      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'monthTested' && key !== 'totalCnt')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month:
              formatMessage(messages[format(negateTimeZoneOffset(new Date(result.monthTested)), 'MMM').toLowerCase()]) +
              format(negateTimeZoneOffset(new Date(result.monthTested)), '-yyyy'),
            value: +result[key].toFixed(3).slice(0, -1),
            type: genLabel(key, assays, formatMessage, messages, i18nKeys),
            originalMonth: result.monthTested,
          })
        )
        return result
      })
      setBarData({ data: expandedBarData })
      setDonutData({ data: pie, total: `${pieAvg}%` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.treatmentGraphStatusMonthly)} />
          <CardContent>
            <Grid container spacing={1} className={styles.Graph_Content}>
              <Grid item xs={12} md={12} lg={2}>
                <Grid container spacing={2} className={styles.Graph_Content_Container}>
                  <Grid item xs={12} md={12} lg={12} className={styles.Graph_Content_ShowLabel}>
                    <FormControlLabel
                      label={formatMessage(graphMessages.showValuesLabel)}
                      control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={10}>
                <Grid container>
                  {barData.data && barData.data.length ? (
                    <Grid item xs={12} md={8}>
                      <ColumnGraph
                        data={barData.data}
                        graphId="treatmentStatusMonthly"
                        xField="month"
                        yField="value"
                        seriesField="type"
                        showLabel={showLabel}
                        isPercentage
                        onReady={plot => {
                          plot.on('plot:click', evt => {
                            const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)

                            const params = {
                              treatmentStatus:
                                evt.data.data.id === 'NotConfirmed' ? 'AwaitingTreatment' : 'OnTreatment',
                              minDate,
                              maxDate,
                              displayResult: 'actual',
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
                        graphId="treatmentStatusMonthlyPie"
                        graphTitle={[
                          formatMessage(graphMessages.treatmentStatusTotalTitle)
                            .split(' ')
                            .splice(
                              0,
                              Math.ceil(formatMessage(graphMessages.treatmentStatusTotalTitle).split(' ').length / 2)
                            )
                            .join(' '),
                          formatMessage(graphMessages.treatmentStatusTotalTitle)
                            .split(' ')
                            .splice(
                              Math.ceil(formatMessage(graphMessages.treatmentStatusTotalTitle).split(' ').length / 2)
                            )
                            .join(' '),
                        ].join('<br/>')} // "Average Monthly<br/>Test Performed"
                        showLabel={showLabel}
                        legend={false}
                      />
                    </Grid>
                  ) : (
                    <Loading />
                  )}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TreatmentStatusGraph

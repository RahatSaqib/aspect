import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import filter from 'lodash/filter'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages } from '../../../messages'
import { useFilterUpdate } from '../../../providers/FilterProvider'
import { getWhitelistedAssays } from '../../../utils/utils/graph'
import { formatDataByGraphType, Loading } from '../../index'
import messages from '../graphMessages'
import styles from '../graphStyles.css'
import {
  prepAssaysForParams,
  getAverageFromData,
  calcPercentageForGraphs,
  genLabel,
  prepParamsForEndPoint,
  negateTimeZoneOffset,
} from '../graphUtils'
import { DonutGraph, ColumnGraph } from '../index'

const cssClasses = classnames.bind(styles)

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

const endPointParams = {
  minDate: startOfMonth(subMonths(new Date(), 12)),
  maxDate: endOfMonth(subMonths(new Date(), 1)),
}

const TreatmentStatusGraph = ({ assaysFromState }) => {
  const { formatMessage, format } = useI18n()
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
      fetchWrapperForQueries({ endpoint: '/result/confirmed-treatment-tracking', params: endPointParams })
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
      const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0)
      const { avg: pieAvg } = getAverageFromData(pieData, 'value', ['Confirmed'], 'standard')
      const pie = pieData.map(d => ({
        ...d,
        label: genLabel(d.id, assaysFromState, formatMessage, messages, i18nKeys),
        value: pieTotal < 1 ? pieTotal : +calcPercentageForGraphs(d.value, pieTotal, 2),
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
            month: format(negateTimeZoneOffset(new Date(result.monthTested)), 'MMM-yyyy'),
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
    <Grid container className={cssClasses('Graph_Container')}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.treatmentGraphStatusMonthly)} />
          <CardContent>
            <Grid container spacing={1} className={cssClasses('Graph_Content')}>
              <Grid item xs={12} md={12} lg={2}>
                <Grid container spacing={2} className={cssClasses('Graph_Content_Container')}>
                  <Grid item xs={12} md={12} lg={12} className={cssClasses('Graph_Content_ShowLabel')}>
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
                            const base = 'yyyy-MM-dd'
                            const parsedDate = negateTimeZoneOffset(new Date(evt.data.data.originalMonth), base)

                            const params = {
                              treatmentStatus:
                                evt.data.data.id === 'NotConfirmed' ? 'AwaitingTreatment' : 'OnTreatment',
                              maxDate: format(endOfMonth(parsedDate), base),
                              minDate: format(startOfMonth(parsedDate), base),
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

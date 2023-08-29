import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subMonths from 'date-fns/subMonths'
import filter from 'lodash/filter'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../../cleanComponents/ErrorBoundary'
import DonutGraph from '../../../../cleanComponents/Graphs/DonutGraph/DonutGraph'
import Loading from '../../../../cleanComponents/Loading'
import {
  prepAssaysForParams,
  formatDataByGraphType,
  getAverageFromData,
  calcPercentageForGraphs,
  translateLabel,
  prepParamsForEndPoint,
} from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import { graphMessages } from '../../../../messages'
import { getWhitelistedAssays } from '../../../../utils/utils/graph'
import styles from '../styles.css'
import MainGraph from './TreatmentStatusGraph.Main'

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
  const { formatMessage } = useI18n()
  const [showLabel, setShowLabel] = useState(false)

  const whiteListed = getWhitelistedAssays({ assays, assaysFromState })

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/confirmed-treatment-tracking', params: endPointParams })
  )

  // code for donut
  const [donutData, setDonutData] = useState({})
  useEffect(() => {
    if (data && data.data) {
      const info = data.data
      const i18nKeysCollection = { Confirmed: 'Confirmed', NotConfirmed: 'NotConfirmed' }
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

      const graphData = formatDataByGraphType(
        info,
        'percentage',
        false,
        'MMM yy',
        'monthTested',
        'onTreatment',
        i18nKeysCollection,
        'pieLegacyTreatment',
        mergedParams,
        formatMessage,
        messages
      )
      const translations = graphData.map(g => ({
        id: g.id,
        t: translateLabel(g.id, assaysFromState, formatMessage, messages, i18nKeysCollection),
      }))
      const total = graphData.reduce((acc, curr) => acc + curr.value, 0)
      const { avg } = getAverageFromData(graphData, 'value', ['Confirmed'], 'standard')
      const parsedData = graphData.map(d => ({
        ...d,
        label: translations.filter(t => t.id === d.id)[0].t,
        value: total < 1 ? total : +calcPercentageForGraphs(d.value, total, 2),
      }))
      setDonutData({ data: parsedData, total: `${avg}%` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter])

  return isLoading ? (
    <Loading />
  ) : (
    <ErrorBoundary>
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
                    <MainGraph
                      rawData={data.data}
                      assaysFromState={assaysFromState}
                      whiteListed={whiteListed}
                      showLabel={showLabel}
                    />
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
                          legend={false}
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
    </ErrorBoundary>
  )
}

export default TreatmentStatusGraph

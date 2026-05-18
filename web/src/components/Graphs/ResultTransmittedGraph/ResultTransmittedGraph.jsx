import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import EmptyGraph from '../../../components/Graphs/EmptyData'
import fetchWrapperForQueries from '../../QueryFetch'
import { graphMessages } from '../../../messages'
import { dateRangeOptions } from '../../../components/shared/DateTimeInput/utils/date'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'
import {
  getTimePeriod,
  formatDateToYYYYMMDD,
  formatDataByGraphType,
  PeriodSelector,
  Loading,
  PieRowGraph,
} from '../../index'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const ResultTransmittedGraph = () => {
  const { formatMessage, formatDate } = useIntl()

  const dateRanges = dateRangeOptions(formatMessage, formatDate, 'resultsDateRange', false)
  const currentMonth = dateRanges.resultsDateRange.find(dr => dr.id === DATE_RANGE_OPTIONS.CURRENT_MONTH).value.minDate

  const [graphData, setGraphData] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState({
    minDate: getTimePeriod(1, 'months', 'yyyy-MM-dd'),
    maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd'),
  })

  const mergedParams = filter ? [{ currentMonth: filter.minDate }] : [{ currentMonth }]

  const { data, isLoading } = useQuery(
    ['resultsTransmittedDials', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/dashboard/results-transmitted', params: mergedParams }),
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  )

  function formatRawData() {
    return formatDataByGraphType(
      data.data,
      'percentage',
      false,
      'LLLL do',
      'date',
      'devicesActive',
      undefined,
      'pieRow',
      mergedParams,
      formatMessage,
      messages,
      formatDate // its only here because its needed in only one case
    )
  }

  useEffect(() => {
    if (data && data.data) {
      const grouped = formatRawData()
      if (grouped) {
        setGraphData(grouped)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.resultsTransmittedTitle)} />
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
                    <PeriodSelector
                      label={formatMessage(graphMessages.date)}
                      noAny
                      noDay
                      noWeek
                      noQuarter
                      noYear
                      noCustom
                      minDate={filter.minDate || null}
                      maxDate={filter.maxDate || null}
                      onChange={dateValues => {
                        setFilter({
                          ...filter,
                          minDate: dateValues.minDate ? formatDateToYYYYMMDD(dateValues.minDate) : filter.minDate,
                          maxDate: dateValues.maxDate ? formatDateToYYYYMMDD(dateValues.maxDate) : filter.minDate,
                        })
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={10}>
                <Grid container>
                  {isLoading ? (
                    <Loading />
                  ) : (
                    <Grid item xs={12} md={12} lg={12}>
                      <div className={styles.Graph_Wrapper}>
                        {graphData && !isEmpty(graphData) ? (
                          <PieRowGraph data={graphData} componentClasses={['piegraph__container--nobg']} />
                        ) : (
                          <EmptyGraph type="pieRow" />
                        )}
                      </div>
                    </Grid>
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

export default ResultTransmittedGraph

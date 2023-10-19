import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import EmptyGraph from '../../../components/Graphs/EmptyData'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import { graphMessages } from '../../../messages'
import { dateRangeOptions } from '../../../oldComponents/shared/DateTimeInput/utils/date'
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
import styles from '../graphStyles.css'

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const dateRanges = dateRangeOptions('resultsDateRange', false)
const currentMonth = dateRanges.resultsDateRange.find(dr => dr.id === DATE_RANGE_OPTIONS.CURRENT_MONTH).value.minDate

const cssClasses = classnames.bind(styles)

const ResultTransmittedGraph = () => {
  const { formatMessage } = useI18n()

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
      fetchWrapperForQueries({ endpoint: '/dashboard/results-transmitted', params: mergedParams })
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
      messages
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
    <Grid container className={cssClasses('Graph_Container')}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.resultsTransmittedTitle)} />
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
                      <div className={cssClasses('Graph_Wrapper')}>
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

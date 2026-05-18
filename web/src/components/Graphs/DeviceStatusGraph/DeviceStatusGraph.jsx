import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Switch, FormControlLabel, Grid } from '@mui/material'
import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import subtractDays from 'date-fns/subDays'
import filter from 'lodash/filter'
import sumBy from 'lodash/sumBy'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../QueryFetch'
import { graphMessages } from '../../../messages'
import { GRAPHS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import { formatDataByGraphType, Loading, ColumnGraph, PeriodSelector, genLabel } from '../../index'
import messages from '../graphMessages'
import styles from '../graphStyles.module.css'

const i18nKeys = {
  devicesActive: 'devicesActive',
  devicesInactive: 'devicesInactive',
  inactiveUnknown: 'inactiveUnknown',
  inactiveNoTestsPerformed: 'inactiveNoTestsPerformed',
  inactiveOutOfInventory: 'inactiveOutOfInventory',
  inactiveDownForRepair: 'inactiveDownForRepair',
  inactiveDecommissioned: 'inactiveDecommissioned',
  weekendOrHoliday: 'weekendOrHoliday',
  inactiveNoStaff: 'inactiveNoStaff',
  inactiveNoSamples: 'inactiveNoSamples',
  inactiveNoPower: 'inactiveNoPower',
  inactiveOther: 'inactiveOther',
}

const calcOverallRate = (keyToCalc, totalTotal, gData, filterCriteria) => {
  if (filterCriteria) {
    gData = filter(gData, filterCriteria)
  }

  const totalKey = sumBy(gData, d => Number(d[keyToCalc]))
  const total = sumBy(gData, d => Number(d[totalTotal]))
  const percentage = total > 0 ? (totalKey / total) * 100 : total
  return percentage
}

const today = new Date()
const defaultFilters = {
  minDate: startOfDay(subtractDays(today, 30)),
  maxDate: endOfDay(today),
}

const DeviceStatusGraph = ({ assaysFromState }) => {
  const { formatMessage } = useIntl()

  const [showLabel, setShowLabel] = useState(false)
  const [filter, setFilter] = useState(defaultFilters)

  const mergedParams = [{ minDate: filter.minDate }, { maxDate: filter.maxDate }]

  const { data, isLoading } = useQuery(
    ['deviceStatusMonthly', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/dashboard/operational-data/activity-over-time', params: mergedParams }),
    { ...GRAPHS_QUERY_OPTIONS }
  )

  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (data && data.data) {
      const info = data.data

      // code for column
      const groupedForBar = formatDataByGraphType(
        info,
        'percentage',
        false,
        'LLLL do',
        'date',
        'devicesActive',
        i18nKeys,
        'stackedDeviceActivity',
        mergedParams,
        formatMessage,
        messages
      )
      const expandedBarData = []
      groupedForBar.map(result => {
        const filterOut = ['date', 'devicesTotal', 'devicesInactive', 'devicesActiveRaw', 'isWeekendOrHoliday']
        const allKeysButMonth = Object.keys(result)
          .filter(key => !filterOut.includes(key))
          .reverse()

        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            date: `${formatMessage(messages[result.date.split(' ')[0].toLowerCase()])} ${result.date.split(' ')[1]}`,
            value: +result[key]?.toFixed(1),
            type: genLabel(key, assaysFromState, formatMessage, messages, i18nKeys),
            realValue:
              key === 'weekendOrHoliday'
                ? result.devicesTotal - result.devicesActiveRaw
                : Math.round((result[key] * result.devicesTotal) / 100),
          })
        )
        return result
      })
      setBarData({
        data: expandedBarData,
        average: calcOverallRate('devicesActiveRaw', 'devicesTotal', groupedForBar, { weekendOrHoliday: 0 }).toFixed(0),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <Grid container className={styles.Graph_Container}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={formatMessage(graphMessages.deviceStatusTitle)} />
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
                      noAny
                      label={formatMessage(graphMessages.date)}
                      minDate={filter.minDate || null}
                      maxDate={filter.maxDate || null}
                      onChange={dateValues => setFilter({ ...filter, ...dateValues })}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={10}>
                <Grid container>
                  {isLoading ? (
                    <Loading />
                  ) : (
                    <>
                      {barData.data && barData.data.length ? (
                        <Grid item xs={12}>
                          <ColumnGraph
                            data={barData.data}
                            graphId="deviceStatusMonthly"
                            xField="date"
                            yField="value"
                            seriesField="type"
                            showLabel={showLabel}
                            isPercentage
                            tooltip={{
                              customContent: (_title, _data) => {
                                const withData = _data.filter(d => d.value > 0)
                                return `
  <div class="g2-tooltip-title">${_title}</div>
  <ul class="g2-tooltip-list" style="margin: 0px; list-style-type: none; padding: 0px;">
  ${withData
    ?.map(
      r => `<li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
    <span class="g2-tooltip-name">${r.name}</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${r.data.realValue} Devices</span>
    </li>`
    )
    .join('')}
  </ul>`
                              },
                            }}
                            annotations={[
                              {
                                type: 'line',
                                start: ['min', barData.average],
                                end: ['max', barData.average],
                                style: { stroke: 'rgba(32, 161, 179, 1)', strokeWidth: 5 },
                              },
                              {
                                type: 'text',
                                position: ['min', barData.average],
                                content: `${barData.average}%`,
                                offsetY: -4,
                                style: { textBaseline: 'bottom', fill: 'rgba(32, 161, 179, 1)' },
                              },
                            ]}
                          />
                        </Grid>
                      ) : null}
                    </>
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

export default DeviceStatusGraph

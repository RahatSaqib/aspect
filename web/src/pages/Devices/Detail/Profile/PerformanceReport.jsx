import React, { useEffect, useState } from 'react'
import { Card, Grid } from '@mui/material'
import differenceInBusinessDays from 'date-fns/differenceInBusinessDays'
import endOfMonth from 'date-fns/endOfMonth'
import parseISO from 'date-fns/parseISO'
import startOfMonth from 'date-fns/startOfMonth'
import { number, object, oneOfType, string } from 'prop-types'
import { defineMessages, useIntl } from 'react-intl'
import { ColumnGraph } from '../../../../cleanComponents'
import variables from '../../../../theme/colors'
import styles from '../styles.module.css'
import messages from './messages'

const customMessages = defineMessages({
  totalResults: {
    id: 'performance.barChart.results',
    defaultMessage: 'Total Results',
  },
  totalCapacity: {
    id: 'performance.barChart.capacity',
    defaultMessage: 'Total Capacity',
  },
  totalErrors: {
    id: 'performance.barChart.errors',
    defaultMessage: 'Total Errors',
  },
})

const { '--aspect-color-shakespeare': shakespeare } = variables.customPropertiesVariables
const { '--aspect-color-mandy': mandy } = variables.customPropertiesVariables

const PerformanceReport = ({ performanceReport, dailyCapacity, culture }) => {
  const { formatMessage } = useIntl()

  const [utilizationData, setUtilizationData] = useState({})
  const [errorData, setErrorData] = useState({})
  useEffect(() => {
    if (performanceReport) {
      const utilization = []
      const error = []
      const { data, utilizationRateAvg, errorRateAvg } = performanceReport.toJS()
      data.shift()

      data.forEach(i => {
        const date = new Date(i.monthTested)
        const monthName = date.toLocaleString(culture, { month: 'short', timeZone: 'UTC' })
        const isoDate = parseISO(i.monthTested)

        utilization.push(
          {
            period: monthName,
            type: formatMessage(messages.aboveAverageUtilizationRate),
            value: i.utilizationRate > utilizationRateAvg ? i.utilizationRate - utilizationRateAvg : 0,
          },
          {
            period: monthName,
            type: formatMessage(messages.utilizationRate),
            value: i.utilizationRate > utilizationRateAvg ? utilizationRateAvg : i.utilizationRate || 0,
            totalCapacity: dailyCapacity * differenceInBusinessDays(endOfMonth(isoDate), startOfMonth(isoDate)),
            totalResult: i.totalResult || 0,
          }
        )

        error.push(
          {
            period: monthName,
            type: formatMessage(messages.aboveAverageErrorRate),
            value: i.errorRate > errorRateAvg ? i.errorRate - errorRateAvg : 0,
          },
          {
            period: monthName,
            type: formatMessage(messages.errorRate),
            value: i.errorRate > errorRateAvg ? errorRateAvg : i.errorRate || 0,
            errorCount: i.errorCount || 0,
            totalResult: i.totalResult || 0,
          }
        )
      })
      setUtilizationData({ data: utilization, average: utilizationRateAvg })
      setErrorData({ data: error, average: errorRateAvg })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performanceReport])

  return (
    <section className={styles.Section}>
      <Card className={styles.Section}>
        <p data-panel-title>{formatMessage(messages.performanceTitle)}</p>
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <p>{formatMessage(messages.utilizationRate)}</p>
            {utilizationData.data && utilizationData.data.length ? (
              <ColumnGraph
                data={utilizationData.data}
                xField="period"
                yField="value"
                seriesField="type"
                isPercentage
                tooltip={{
                  customContent: (_title, _data) => `
  <div class="g2-tooltip-title">${_title}</div>
  <ul class="g2-tooltip-list" style="margin: 0px; list-style-type: none; padding: 0px;">
    <li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span class="g2-tooltip-name">% Utilization Rate</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${_data.reduce(
        (acc, item) => acc + +item.value,
        0
      )}</span>
    </li>
    <li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span class="g2-tooltip-name">${formatMessage(
        customMessages.totalCapacity
      )}</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${_data.reduce(
                    (acc, item) => acc + (+item.data.totalCapacity || 0),
                    0
                  )}</span>
    </li>
    <li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span class="g2-tooltip-name">${formatMessage(
        customMessages.totalResults
      )}</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${_data.reduce(
                    (acc, item) => acc + (+item.data.totalResult || 0),
                    0
                  )}</span>
    </li>
  </ul>`,
                }}
                annotations={[
                  {
                    type: 'line',
                    start: ['min', utilizationData.average],
                    end: ['max', utilizationData.average],
                    style: { stroke: shakespeare, lineDash: [2, 2] },
                  },
                  {
                    type: 'text',
                    position: ['min', utilizationData.average],
                    content: `${formatMessage(messages.average)}: ${utilizationData.average}%`,
                    offsetY: -4,
                    style: { textBaseline: 'bottom' },
                  },
                ]}
                colors={['#9FD466', '#9AD7EE']}
              />
            ) : null}
          </Grid>
          <Grid item xs={12} md={6}>
            <p>{formatMessage(messages.errorRate)}</p>
            {errorData.data && errorData.data.length ? (
              <ColumnGraph
                data={errorData.data}
                xField="period"
                yField="value"
                seriesField="type"
                isPercentage
                tooltip={{
                  customContent: (_title, _data) => `
  <div class="g2-tooltip-title">${_title}</div>
  <ul class="g2-tooltip-list" style="margin: 0px; list-style-type: none; padding: 0px;">
    <li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span class="g2-tooltip-name">% Error Rate</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${_data.reduce(
        (acc, item) => acc + +item.value,
        0
      )}</span>
    </li>
    <li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span class="g2-tooltip-name">${formatMessage(
        customMessages.totalErrors
      )}</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${_data.reduce(
                    (acc, item) => acc + (+item.data.errorCount || 0),
                    0
                  )}</span>
    </li>
    <li class="g2-tooltip-list-item" data-index="" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
      <span class="g2-tooltip-name">${formatMessage(
        customMessages.totalResults
      )}</span>: <span class="g2-tooltip-value" style="display: inline-block; float: right; margin-left: 30px;">${_data.reduce(
                    (acc, item) => acc + (+item.data.totalResult || 0),
                    0
                  )}</span>
    </li>
  </ul>`,
                }}
                annotations={[
                  {
                    type: 'line',
                    start: ['min', errorData.average],
                    end: ['max', errorData.average],
                    style: { stroke: mandy, lineDash: [2, 2] },
                  },
                  {
                    type: 'text',
                    position: ['min', errorData.average],
                    content: `${formatMessage(messages.average)}: ${errorData.average}%`,
                    offsetY: -4,
                    style: { textBaseline: 'bottom' },
                  },
                ]}
                colors={['#D91C17', '#F18888']}
              />
            ) : null}
          </Grid>
        </Grid>
      </Card>
    </section>
  )
}

PerformanceReport.propTypes = {
  performanceReport: oneOfType([object]).isRequired,
  culture: string.isRequired,
  dailyCapacity: number.isRequired,
}

export default PerformanceReport

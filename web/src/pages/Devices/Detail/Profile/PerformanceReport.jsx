import React from 'react'
import { oneOfType, object, string, number } from 'prop-types'
import classnames from 'classnames/bind'
import Card from '@mui/material/Card'
import useI18n from '../../../../hooks/useI18n'
import PerformanceBarChart from './PerformanceBarChart'
import styles from '../DeviceDetail.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const PerformanceReport = ({ performanceReport, dailyCapacity, culture }) => {
  const payload = performanceReport.toJS()
  let maxUtilizationRate = 0
  let maxErrorRate = 0
  const { formatMessage } = useI18n()
  if (payload.data) {
    payload.data.forEach(item => {
      const date = new Date(item.monthTested)
      const monthName = date.toLocaleString(culture, {
        month: 'short',
        timeZone: 'UTC',
      })
      item.period = monthName
      item.exceededErrorRate = item.errorRate > payload.errorRateAvg ? item.errorRate - payload.errorRateAvg : 0
      item.errorRate = item.errorRate > payload.errorRateAvg ? payload.errorRateAvg : item.errorRate
      item.exceededUtilizationRate =
        item.utilizationRate > payload.utilizationRateAvg ? item.utilizationRate - payload.utilizationRateAvg : 0
      item.utilizationRate =
        item.utilizationRate > payload.utilizationRateAvg ? payload.utilizationRateAvg : item.utilizationRate
    })
    maxUtilizationRate = payload.data.reduce(
      (prev, current) =>
        prev > current.utilizationRate + current.exceededUtilizationRate
          ? prev
          : current.utilizationRate + current.exceededUtilizationRate,
      payload.utilizationRateAvg
    )
    maxErrorRate = payload.data.reduce(
      (prev, current) =>
        prev > current.errorRate + current.exceededErrorRate ? prev : current.errorRate + current.exceededErrorRate,
      payload.errorRateAvg
    )

    maxErrorRate = maxErrorRate === 100 ? maxErrorRate : maxErrorRate + 10
    maxUtilizationRate += 10
  }

  const avgUtilizationRate = payload.utilizationRateAvg
  const avgErrorRate = payload.errorRateAvg
  const { data } = payload
  const { '--aspect-color-white': colorWhite } = process.env
  const utilizationRateSeries = [
    {
      label: 'Utilization Rate',
      key: 'utilizationRate',
      color: process.env['--aspect-color-shakespeare'],
    },
    {
      label: 'Above Target Utilization Rate',
      key: 'exceededUtilizationRate',
      color: colorWhite,
    },
  ]
  const errorRateSeries = [
    {
      label: 'Error Rate',
      key: 'errorRate',
      color: process.env['--aspect-color-mandy'], // green
    },
    {
      label: 'Above Average Error Rate',
      key: 'exceededErrorRate',
      color: colorWhite,
    },
  ]
  return (
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Section')}>
        <p data-panel-title>{formatMessage(messages.performanceTitle)}</p>
        <div data-graph-container>
          {data && data[0].utilizationRate !== null && (
            <div className={cssClasses('Graph_Container')} data-utilization-graph>
              {data && (
                <div>
                  <p>{formatMessage(messages.utilizationRate)}</p>
                  <PerformanceBarChart
                    data={data}
                    dailyCapacity={dailyCapacity}
                    series={utilizationRateSeries}
                    color="--aspect-color-shakespeare"
                    legend={formatMessage(messages.percentageLegend)}
                    avgValue={avgUtilizationRate}
                    maxValue={maxUtilizationRate}
                    info={formatMessage(messages.utilizationRate)}
                  />
                  <div className={cssClasses('Graph_Legend')}>
                    <div data-utilization-rate-legend>
                      <div />
                      <span>{formatMessage(messages.utilizationRate)}</span>
                    </div>
                    <div data-utilization-rate-average-legend>
                      <div /> <span> {formatMessage(messages.target)} </span>
                    </div>
                    <div data-utilization-rate-above-average-legend>
                      <div /> <span>{formatMessage(messages.aboveTarget)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={cssClasses('Graph_Container')}>
            {data && (
              <div>
                <p>{formatMessage(messages.errorRate)}</p>
                <PerformanceBarChart
                  data={data}
                  dailyCapacity={dailyCapacity}
                  series={errorRateSeries}
                  color="--aspect-color-mandy"
                  legend={formatMessage(messages.percentageLegend)}
                  avgValue={avgErrorRate}
                  maxValue={maxErrorRate}
                  info={formatMessage(messages.errorRate)}
                />
                <div className={cssClasses('Graph_Legend')}>
                  <div data-error-rate-legend>
                    <div /> <span>{formatMessage(messages.errorRate)} </span>
                  </div>
                  <div data-error-rate-average-legend>
                    <div />
                    <span> {formatMessage(messages.countryAverage)}</span>
                  </div>
                  <div data-error-rate-above-average-legend>
                    <div /> <span>{formatMessage(messages.aboveAverage)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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

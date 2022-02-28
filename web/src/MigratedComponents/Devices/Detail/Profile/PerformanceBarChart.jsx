import React from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { oneOfType, object, array, string, number } from 'prop-types'
import classnames from 'classnames/bind'
import styles from '../DeviceDetail.css'

const cssClasses = classnames.bind(styles)

const PerformanceBarChart = ({
  data,
  series,
  color,
  legend,
  avgValue,
  maxValue,
  info,
  dailyCapacity,
}) => (
  <ResponsiveBar
    data={data}
    indexBy="period"
    keys={series.map(x => x.key)}
    margin={{ top: 10, right: 0, bottom: 90, left: 50 }}
    padding={0.01} // between stacks, (ratio)
    innerPadding={1} // between bars in a stack, (px)
    enableGridY={false}
    enableLabel={false}
    defs={[
      {
        id: 'lines',
        type: 'patternLines',
        background: 'inherit',
        color: process.env[color],
        rotation: 45,
        lineWidth: 7,
        spacing: 8,
      },
    ]}
    fill={[
      {
        match: {
          id: 'exceededErrorRate',
        },
        id: 'lines',
      },
      {
        match: {
          id: 'exceededUtilizationRate',
        },
        id: 'lines',
      },
    ]}
    axisLeft={{
      tickRotation: 0,
      legend,
      legendPosition: 'middle',
      legendOffset: -40,
    }}
    colors={bar => series.find(x => x.key === bar.id).color}
    animate
    markers={[
      {
        axis: 'y',
        value: avgValue,
        lineStyle: {
          stroke: process.env['--aspect-color-ship-cove'],
          strokeWidth: 2,
        },
        legendOrientation: 'vertical',
      },
    ]}
    tooltip={({ color, indexValue }) => {
      const periodData = data.find(x => x.period === indexValue)
      // debugger
      const value =
        info === 'Error Rate'
          ? periodData.errorRate + periodData.exceededErrorRate
          : periodData.utilizationRate + periodData.exceededUtilizationRate
      const totalResultsLabel = `Total Results: ${periodData.totalResult}`
      const errorsCapacityLabel =
        info === 'Error Rate'
          ? `Total errors: ${periodData.errorCount}`
          : `Daily Capacity: ${dailyCapacity}`
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={cssClasses('Performance--graph-tooltip-color')}
              style={{ backgroundColor: color }}
            />
            {`% ${info}-- `}
          </div>
          <div>
            {`${indexValue}: `}
            <strong>{value}</strong>%
          </div>
          <div>{errorsCapacityLabel}</div>
          <div>{totalResultsLabel}</div>
        </div>
      )
    }}
    maxValue={maxValue}
    motionStiffness={90}
    motionDamping={15}
  />
)

PerformanceBarChart.propTypes = {
  data: oneOfType([object, array]).isRequired,
  series: oneOfType([object, array]).isRequired,
  color: string.isRequired,
  legend: string.isRequired,
  avgValue: number.isRequired,
  maxValue: number.isRequired,
  info: string.isRequired,
  dailyCapacity: number.isRequired,
}

export default PerformanceBarChart

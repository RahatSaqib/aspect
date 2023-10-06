import React from 'react'
import { Line } from '@ant-design/plots'
import { formatNumber } from '../../../../utils/utils/number'
import { filterColour } from '../../graphUtils'

const LineGraph = ({ data, graphId, showLabel }) => {
  const config = {
    data,
    color: datum => filterColour(datum.year, graphId),
    label: showLabel ? {} : undefined, // format for label on top of section
    xField: 'month',
    yField: 'value',
    seriesField: 'year',
    legend: { position: 'bottom', maxRow: 3 },
    point: {
      size: 3,
      shape: 'circle',
      style: {
        lineWidth: 1,
        fillOpacity: 1,
      },
    },
    animation: false,
    appendPadding: 20,
    tooltip: {
      formatter: datum => ({ name: datum.year, value: formatNumber(datum.value) }),
    },
    yAxis: {
      label: {
        formatter: text => formatNumber(text),
      },
    },
  }

  return <Line {...config} />
}

export default LineGraph

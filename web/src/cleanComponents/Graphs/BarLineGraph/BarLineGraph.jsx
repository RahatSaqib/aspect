import React from 'react'
import { DualAxes } from '@ant-design/plots'
import { filterColour } from '../graphUtils'

const BarLineGraph = ({ data, graphId, showLabel }) => {
  const config = {
    data, // [bar, line]
    xField: 'quarter',
    yField: ['value', 'percentage'],
    geometryOptions: [
      {
        color: datum => filterColour(datum.type === 'MtbDetected' ? 'caseDetected' : 'caseTotal', graphId),
        geometry: 'column',
        isGroup: true,
        seriesField: 'type',
        label: showLabel ? { position: 'middle', content: originData => originData.value } : false,
      },
      {
        geometry: 'line',
        color: () => filterColour('casePercentDetectedOfTotal', graphId),
        label: showLabel ? { content: originData => `${originData.percentage}%` } : undefined, // format for label on top of section
        point: {
          size: 3,
          shape: 'circle',
          style: { lineWidth: 1, fillOpacity: 1 },
        },
      },
    ],
    tooltip: {
      formatter: datum =>
        datum.percentage
          ? { name: `Percentage`, value: `${datum.percentage}%` }
          : { name: `${datum.type}`, value: `${datum.value}` },
    },
    yAxis: {
      percentage: { min: 0, max: 100 },
    },
    legend: { position: 'bottom', maxRow: 3 },
    animation: false,
  }
  return data ? <DualAxes {...config} /> : null
}

export default BarLineGraph

import React from 'react'
import { Column } from '@ant-design/plots'
import { filterColour } from '../graphUtils'

const BarGraph = ({ data, graphId, xField, showLabel, onReady, isPercentage }) => {
  const config = {
    data,
    color: datum => filterColour(data.find(d => d.type === datum.type).id, graphId),
    label: showLabel
      ? { position: 'middle', content: originData => (isPercentage ? `${originData.value}%` : originData.value) }
      : false, // format for label on top of section
    isStack: true,
    xField,
    yField: 'value',
    seriesField: 'type',
    animation: false,
    legend: { position: 'bottom', maxRow: 3 },
    tooltip: {
      formatter: datum => ({
        name: `${datum.type}`,
        value: isPercentage ? `${datum.value}%` : `${datum.value}`,
      }),
    },
    onReady,
  }

  return <Column {...config} />
}

export default BarGraph

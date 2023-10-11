import React from 'react'
import { DualAxes } from '@ant-design/plots'
import { formatNumber } from '../../../../utils/utils/number'
import { filterColour } from '../../graphUtils'

const BarLineGraph = ({ data, colors, graphId, showLabel, xField, yField }) => {
  const config = {
    data, // [bar, line]
    xField,
    yField, // percentage translated field must be always the last value of the array
    geometryOptions: [
      {
        color: datum => filterColour(colors.find(c => c.name === datum.type).colorId, graphId),
        geometry: 'column',
        isGroup: true,
        seriesField: 'type',
        label: showLabel ? { position: 'middle', content: originData => originData.value } : false,
      },
      {
        geometry: 'line',
        color: () => filterColour(colors.find(c => c.name === yField[1]).colorId, graphId),
        label: showLabel ? { content: originData => `${originData[yField[1]]}%`, position: 'middle' } : undefined, // format for label on top of section
        point: {
          size: 3,
          shape: 'circle',
          style: { lineWidth: 1, fillOpacity: 1 },
        },
      },
    ],
    tooltip: {
      formatter: datum =>
        datum[yField[1]] >= 0
          ? { name: `${yField[1]}`, value: `${datum[yField[1]]}%` }
          : { name: `${datum.type}`, value: formatNumber(datum.value) },
    },
    yAxis: {
      [yField[1]]: {
        min: 0,
        max: 100,
        label: { formatter: text => `${text}%` },
      },
      [yField[0]]: {
        label: { formatter: text => formatNumber(text) },
      },
    },
    legend: { position: 'bottom', maxRow: 3 },
    animation: false,
    appendPadding: 20,
  }
  return data ? <DualAxes {...config} /> : null
}

export default BarLineGraph

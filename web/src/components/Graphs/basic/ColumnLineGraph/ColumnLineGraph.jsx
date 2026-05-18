import React from 'react'
import { DualAxes } from '@ant-design/plots'
import isNil from 'lodash/isNil'
import { formatNumber } from '../../../../utils/utils/number'
import { filterColour } from '../../graphUtils'

const ColumnLineGraph = ({ data, colors, graphId, showLabel, xField, yField, getCustomProps }) => {
  const config = {
    data, // [bar, line]
    intervalPadding: 4,
    xField,
    yField, // percentage translated field must be always the last value of the array
    geometryOptions: [
      {
        color: datum => filterColour(colors.find(c => c.name === datum.type).colorId, graphId),
        geometry: 'column',
        intervalPadding: 8,
        dodgePadding: 0,
        isGroup: true,
        seriesField: 'type',
        label: showLabel
          ? {
              position: 'middle',
              content: originData => originData.value,
              layout: [
                { type: 'interval-adjust-position' },
                { type: 'interval-hide-overlap' },
                { type: 'adjust-color' },
              ],
            }
          : false,
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
        max: 105, // 5% extra room on top so the dot and label are properly visible when value is 100%
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

  const props = !isNil(getCustomProps) ? getCustomProps(config) : config

  return data ? <DualAxes {...props} /> : null
}

export default ColumnLineGraph

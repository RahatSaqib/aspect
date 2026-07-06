import React from 'react'
import { Column } from '@ant-design/plots'
import { filterColour } from '../../graphUtils'

const ColumnGraph = ({
  data,
  graphId,
  xField,
  yField,
  seriesField,
  showLabel,
  onReady,
  isPercentage,
  colors,
  annotations,
  tooltip,
}) => {
  const config = {
    data,
    intervalPadding: 8,
    dodgePadding: 0,
    color: colors || (datum => filterColour(data.find(d => d.type === datum.type).id, graphId)),
    label: showLabel
      ? {
          position: 'middle',
          content: originData => (isPercentage ? `${originData.value}%` : originData.value),
          layout: [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }],
        }
      : false, // format for label on top of section
    isStack: true,
    isPercentage: graphId === 'deviceStatusMonthly',
    xField,
    yField,
    yAxis: annotations?.length
      ? {
          min: 0,
          max: 100,
          label: { formatter: text => `${text}%` },
        }
      : undefined,
    seriesField,
    annotations,
    animation: false,
    legend: { position: 'bottom', maxRow: 3 },
    tooltip: tooltip || {
      formatter: datum => ({
        name: `${datum.type}`,
        value: isPercentage ? `${datum.value}%` : `${datum.value}`,
      }),
    },
    onReady,
    appendPadding: 20,
  }

  return <Column {...config} />
}

export default React.memo(ColumnGraph)

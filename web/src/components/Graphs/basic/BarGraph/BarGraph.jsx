import React from 'react'
import { Bar } from '@ant-design/plots'
import { formatNumber } from '../../../../utils/utils/number'
import { filterColour } from '../../graphUtils'

const BarGraph = ({
  data,
  graphId,
  xField,
  yField,
  seriesField,
  showLabel,
  onReady,
  isPercentage,
  colors,
  disableFormat,
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
    xField,
    yField,
    xAxis: isPercentage
      ? {
          min: 0,
          max: 100,
          label: { formatter: text => `${text}%` },
        }
      : undefined,
    seriesField,
    animation: false,
    legend: { position: 'bottom', maxRow: 3 },
    tooltip: {
      formatter: datum => ({
        name: `${datum.type}`,
        value: isPercentage ? `${datum.value}%` : `${formatNumber(datum.value)}`,
      }),
    },
    onReady,
    appendPadding: 20,
    yAxis: {
      label: {
        formatter: s => (disableFormat ? s : formatNumber(s)),
      },
    },
  }

  return <Bar {...config} />
}

export default React.memo(BarGraph)

import React from 'react'
import { Line } from '@ant-design/plots'
import { formatNumber } from '../../../../utils/utils/number'
import { filterColour } from '../../graphUtils'

const LineGraph = ({ data, graphId, showLabel, xField, yField, seriesField, ...rest }) => {
  const config = {
    data,
    color: graphId ? datum => filterColour(datum.year, graphId) : undefined,
    label: showLabel ? {} : undefined, // format for label on top of section
    xField,
    yField,
    seriesField,
    legend: { position: 'bottom', maxRow: 3 },
    point: { size: 3, shape: 'circle', style: { lineWidth: 1, fillOpacity: 1 } },
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
    ...rest,
  }

  return <Line {...config} />
}

export default React.memo(LineGraph)

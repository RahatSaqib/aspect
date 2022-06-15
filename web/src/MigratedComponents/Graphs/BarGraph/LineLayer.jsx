import React, { Fragment } from 'react'
import max from 'lodash/max'
import { line } from 'd3-shape'
import { scaleLinear } from 'd3-scale'

import { filterColour } from '../Helpers/Formatters'

// ----------------------------------------------------------
const getPointX = (bar, props) => {
  const { data, groupMode, keys, layout, width, layerProps } = props
  const { valueFieldName } = layerProps
  const totalBars = groupMode === 'grouped' ? keys.length : 1
  if (layout === 'horizontal') {
    const maxValue = max(data.map(d => d[valueFieldName]))
    const x = scaleLinear().domain([0, maxValue]).range([0, width])
    return x(bar.data.data[valueFieldName])
  }

  return bar.x + (totalBars * bar.width) / 2
}
// ----------------------------------------------------------
const getPointY = (bar, props) => {
  const { data, groupMode, height, keys, layout, layerProps } = props
  const { valueFieldName } = layerProps
  const totalBars = groupMode === 'grouped' ? keys.length : 1
  if (layout === 'horizontal') {
    return bar.y + (totalBars * bar.height) / 2
  }

  const maxValue = max(data.map(d => d[valueFieldName]))
  const y = scaleLinear().domain([0, maxValue]).range([height, 0])
  return y(bar.data.data[valueFieldName])
}
// ----------------------------------------------------------
const getColor = barGraphProps => {
  const {
    layerProps,
    baseConfig: { getColorIdByFieldName = () => null },
  } = barGraphProps
  const colorId =
    getColorIdByFieldName(layerProps.valueFieldName) || layerProps.colorId
  return filterColour(colorId)
}

// ----------------------------------------------------------
const Line = barGraphProps => {
  const {
    bars,
    keys: [firstBarNameInSeries],
  } = barGraphProps
  const firstSeriesBars = bars.filter(
    bar => bar.data.id === firstBarNameInSeries
  )
  const lineGenerator = line()
    .x(bar => getPointX(bar, barGraphProps))
    .y(bar => getPointY(bar, barGraphProps))

  const lineColor = getColor(barGraphProps)

  return (
    <Fragment>
      <path
        d={lineGenerator(firstSeriesBars)}
        fill="none"
        stroke={lineColor}
        style={{ pointerEvents: 'none' }}
      />
      {firstSeriesBars.map(bar => (
        <circle
          key={bar.key}
          cx={getPointX(bar, barGraphProps)}
          cy={getPointY(bar, barGraphProps)}
          r={4}
          fill="white"
          stroke={lineColor}
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </Fragment>
  )
}

export default Line

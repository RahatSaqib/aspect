import React, { Fragment, useMemo, useState } from 'react'
import classnames from 'classnames/bind'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import max from 'lodash/max'
import { filterColour, getColorIdByFieldName } from '../Helpers/Formatters'
import styles from './AspectResponsiveBar.css'

const cssClasses = classnames.bind(styles)

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
    baseConfig: { fields = [] },
  } = barGraphProps
  const colorId = getColorIdByFieldName(fields, layerProps.valueFieldName) || layerProps.colorId
  return filterColour(colorId)
}

// ----------------------------------------------------------
const Point = ({
  stroke,
  onMouseOver,
  onMouseOut,
  onMouseMove,
  pointProps: { fillColor = '#fff', shape, r = 4, strokeWidth = 1, width, height, size } = {},
  transform,
}) => {
  const commonProps = {
    fill: fillColor,
    stroke,
    strokeWidth,
    onMouseOver,
    onMouseOut,
    onMouseMove,
  }

  if (shape === 'rect') {
    return (
      <rect
        {...commonProps}
        width={width}
        height={height}
        transform={`translate(-${width / 2}, -${height / 2}) rotate(0)`}
      />
    )
  }

  if (shape === 'diamond') {
    return (
      <rect
        {...commonProps}
        width={size}
        height={size}
        transform={`translate(0, -${(size * Math.SQRT2) / 2}) rotate(45)`}
      />
    )
  }

  return (
    <g transform={transform}>
      <circle {...commonProps} cx={0} cy={0} r={r} />
    </g>
  )
}

// ----------------------------------------------------------
const Tooltip = ({ coordinates, index, pointProps, stroke, tooltipProps, value }) => {
  if (!tooltipProps) return null
  const { r = 4, strokeWidth = 1, formatText = val => val } = pointProps || {}
  const { width: tooltipWidth = 170, height: tooltipHeight = 24 } = tooltipProps || {}
  const shapeWidth = 2 * r
  const lineLength = 3 + shapeWidth + 2 * strokeWidth + 3
  const dx = 5 // line-&-shape padding left
  const dy = tooltipHeight / 2 // line-&-shape padding top

  const position = coordinates[index]
  const shiftX = index >= coordinates.length / 2 ? -15 - tooltipWidth : 15
  const shiftY = -10
  const x = position.x + shiftX
  const y = position.y + shiftY
  return (
    <Fragment>
      <g transform={`translate(${x}, ${y}) rotate(0)`}>
        <rect
          fill="#fff"
          width={tooltipWidth}
          height={tooltipHeight}
          stroke="#ccc"
          style={{ pointerEvents: 'none' }}
          className={cssClasses('aspectresponsivebar__tooltip-rect')}
        />
        <line x1={0} x2={lineLength} y1={0} y2={0} transform={`translate(${dx}, ${dy}) rotate(0)`} stroke={stroke} />
        <Point
          stroke={stroke}
          pointProps={pointProps}
          transform={`translate(${dx + lineLength / 2}, ${dy}) rotate(0)`}
        />
        <text
          dominantBaseline="central"
          textAnchor="begin"
          transform={`translate(${dx + lineLength + dx}, ${dy}) rotate(0)`}
          className={cssClasses('aspectresponsivebar__tooltip-text')}
        >
          {formatText(value)}
        </text>
      </g>
    </Fragment>
  )
}
// ----------------------------------------------------------
const Line = barGraphProps => {
  const [visibleTooltipIndex, setVisibleTooltipIndex] = useState(-1)
  const {
    bars,
    keys: [firstBarNameInSeries],
    layerProps: { pointProps, tooltipProps, strokeWidth = 1 },
    showLabel,
    showDecimals,
  } = barGraphProps

  // bars of 1st series
  const anchorBars = bars.filter(bar => bar.data.id === firstBarNameInSeries)
  const lineGenerator = line()
    .x(bar => getPointX(bar, barGraphProps))
    .y(bar => getPointY(bar, barGraphProps))

  const coordinates = useMemo(
    () => anchorBars.map(bar => ({ x: getPointX(bar, barGraphProps), y: getPointY(bar, barGraphProps) })),
    [barGraphProps, anchorBars]
  )

  const lineColor = getColor(barGraphProps)

  const getValue = (bars, index) => bars[index].data.data[barGraphProps?.layerProps?.valueFieldName]

  const onMouseOver = (event, index) => setVisibleTooltipIndex(index)
  const onMouseOut = () => setVisibleTooltipIndex(-1)
  const onMouseMove = () => {}

  return (
    <g style={{ position: 'relative' }}>
      <path
        d={lineGenerator(anchorBars)}
        fill="none"
        stroke={lineColor}
        style={{ pointerEvents: 'none', strokeDasharray: '3 3', strokeWidth }}
      />
      {anchorBars.map((bar, index) => (
        <>
          {showLabel ? (
            <text x={coordinates[index].x + 10} y={coordinates[index].y - 5} fill="#000">
              {parseFloat(barGraphProps.data[index][barGraphProps?.layerProps?.valueFieldName]).toFixed(showDecimals)}%
            </text>
          ) : null}
          <g key={bar.key} transform={`translate(${coordinates[index].x}, ${coordinates[index].y})`}>
            <Point
              stroke={lineColor}
              pointProps={pointProps}
              onMouseOver={event => onMouseOver(event, index)}
              onMouseOut={onMouseOut}
              onMouseMove={event => onMouseMove(event, index)}
            />
          </g>
        </>
      ))}

      {visibleTooltipIndex >= 0 ? (
        <Tooltip
          coordinates={coordinates}
          index={visibleTooltipIndex}
          pointProps={pointProps}
          stroke={lineColor}
          tooltipProps={tooltipProps}
          value={getValue(anchorBars, visibleTooltipIndex)}
        />
      ) : null}
    </g>
  )
}

export default Line

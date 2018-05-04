import React from 'react'
import _ from 'lodash'
import { Group } from '@vx/group'
import { withParentSize } from '@vx/responsive'
import { AxisRight } from '@vx/axis'
import { scaleLinear } from '@vx/scale'

const TemperatureGauge = ({
  parentWidth = 200,
  height = 200,
  goal = 100,
  value = 0,
  hasError = false,
  normalColor = process.env['--aspect-color-grey-6'],
  achievedColor = process.env['--aspect-color-mantis'],
  errorColor = process.env['--aspect-color-mandy'],
}) => {
  const width = Math.max(parentWidth, 80)
  const tubeWidth = Math.min(width / 5, 16)
  const margin = { top: 5, bottom: 5 }
  const tubeRadius = tubeWidth / 2
  const tubeBorderWidth = 4
  const tubeY = margin.top + tubeRadius
  const tubeHeight =
    height - tubeY - tubeRadius - margin.bottom + tubeBorderWidth

  const tubeBorderColor = '#91949d'
  const tubeFillColor = '#fff'

  const axisScale = scaleLinear({
    rangeRound: [tubeHeight, 0],
    nice: true,
    domain: [0, 10],
  })

  const fillScale = scaleLinear({
    rangeRound: [tubeY + tubeHeight, tubeY],
    nice: true,
    domain: [0, 10],
  })

  const tubeFillY = fillScale(Math.min(value / goal * 10, 10))

  const fillColor = hasError
    ? errorColor
    : value >= goal ? achievedColor : normalColor

  return (
    <svg width={width} height={height}>
      <Group>
        <circle
          r={tubeWidth / 2}
          cx={width / 2}
          cy={tubeY + tubeBorderWidth}
          fill={tubeBorderColor}
          stroke={tubeBorderColor}
          strokeWidth={tubeBorderWidth}
        />

        <circle
          r={tubeWidth / 2}
          cx={width / 2}
          cy={tubeY + tubeHeight - tubeBorderWidth}
          fill={tubeBorderColor}
          stroke={tubeBorderColor}
          strokeWidth={tubeBorderWidth}
        />

        <rect
          x={width / 2 - tubeWidth / 2}
          y={tubeY + tubeBorderWidth}
          height={tubeHeight - tubeBorderWidth * 2}
          width={tubeWidth}
          shapeRendering="crispEdges"
          fill={tubeFillColor}
          stroke={tubeBorderColor}
          strokeWidth={tubeBorderWidth}
        />

        <rect
          x={width / 2 - (tubeWidth - tubeBorderWidth) / 2}
          y={tubeY}
          height={tubeHeight}
          width={tubeWidth - tubeBorderWidth}
          shapeRendering="crispEdges"
          fill={tubeFillColor}
          stroke="none"
        />

        <rect
          x={width / 2 - (tubeWidth - tubeBorderWidth) / 2}
          y={tubeFillY}
          height={tubeY + tubeHeight - tubeFillY}
          width={tubeWidth - tubeBorderWidth}
          shapeRendering="crispEdges"
          fill={fillColor}
          stroke="none"
        />

        <AxisRight
          scale={axisScale}
          top={tubeY - 1}
          left={width / 2 - tubeWidth / 2}
          stroke={tubeBorderColor}
          tickStroke={tubeBorderColor}
          tickFormat={_.noop}
          hideAxisLine
          hideZero
        />
      </Group>
    </svg>
  )
}

export default withParentSize(TemperatureGauge)

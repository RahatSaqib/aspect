import React from 'react'
import _ from 'lodash'
import { Group } from '@vx/group'
import { ScaleSVG } from '@vx/responsive'
import { AxisRight } from '@vx/axis'
import { scaleLinear } from '@vx/scale'

const TemperatureGauge = ({
  width = 300,
  height = 200,
  goal = 100,
  value = 0,
  hasError = false,
  normalColor = process.env['--aspect-color-grey-6'],
  achievedColor = process.env['--aspect-color-mantis'],
  errorColor = process.env['--aspect-color-mandy'],
}) => {
  const margin = { top: 5, bottom: 5 }

  const bulbRadius = 22
  const bulbY = height - margin.top - margin.bottom - bulbRadius
  const bulbX = width / 2

  const tubeWidth = 20
  const tubeBorderWidth = 4
  const tubeY = margin.top + tubeWidth / 2
  const tubeHeight = bulbY - tubeY - bulbRadius + tubeBorderWidth

  const tubeBorderColor = '#91949d'
  const tubeFillcolor = '#fff'

  const axisScale = scaleLinear({
    rangeRound: [tubeHeight, 0],
    nice: true,
    domain: [0, 10],
  })

  const fillScale = scaleLinear({
    rangeRound: [tubeY + tubeHeight - 2, tubeY],
    nice: true,
    domain: [0, 10],
  })

  const tubeFillY = fillScale(Math.min(value / goal * 10, 10))

  const fillColor = hasError
    ? errorColor
    : value >= goal ? achievedColor : normalColor

  return (
    <ScaleSVG width={width} height={height}>
      <Group>
        <circle
          r={tubeWidth / 2}
          cx={width / 2}
          cy={tubeY + 2}
          fill={tubeBorderColor}
          stroke={tubeBorderColor}
          strokeWidth={tubeBorderWidth}
        />
        <rect
          x={width / 2 - tubeWidth / 2}
          y={tubeY}
          height={tubeHeight}
          width={tubeWidth}
          shapeRendering="crispEdges"
          fill={tubeFillcolor}
          stroke={tubeBorderColor}
          strokeWidth={tubeBorderWidth}
        />

        <circle
          r={bulbRadius}
          cx={bulbX}
          cy={bulbY}
          fill={value > 0 ? fillColor : tubeFillcolor}
          stroke={tubeBorderColor}
          strokeWidth={tubeBorderWidth}
        />

        <rect
          x={width / 2 - (tubeWidth - tubeBorderWidth) / 2}
          y={tubeY}
          height={tubeHeight}
          width={tubeWidth - tubeBorderWidth}
          shapeRendering="crispEdges"
          fill={tubeFillcolor}
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
        />
      </Group>
    </ScaleSVG>
  )
}

export default TemperatureGauge

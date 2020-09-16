// TODO: still being used?
import identity from 'lodash/identity'
import max from 'lodash/max'
import assign from 'lodash/assign'
import flowRight from 'lodash/flowRight'
import isNumber from 'lodash/isNumber'
import React from 'react'
import { scaleLinear, scaleBand } from '@vx/scale'
import { Point } from '@vx/point'
import { Bar, Line } from '@vx/shape'
import { AxisBottom } from '@vx/axis'
import { ScaleSVG } from '@vx/responsive'

const enhance = identity

const AbnormalBarGraph = ({
  clientWidth = 150,
  clientHeight = 100,
  margin: rawMargin = {},
  xPadding = 0.4,
  yPadding = 1,
  average,
  data,
  x,
  y,
  key = identity,
  yDomainMax = max(data.map(y)),
  fill,
}) => {
  const margin = assign({}, { top: 0, bottom: 0, left: 0, right: 0 }, rawMargin)

  // Create bounds
  const xPointMax = clientWidth - margin.left - margin.right
  const yPointMax = clientHeight - margin.top - margin.bottom

  // Scale the graph axes according to data
  const xScale = scaleBand({
    rangeRound: [0, xPointMax],
    domain: data.map(x),
    padding: xPadding,
  })

  const yScale = scaleLinear({
    rangeRound: [yPointMax, 0],
    domain: [yDomainMax, 0],
    padding: yPadding,
  })

  // Compose together the scale and accessor functions to get point functions
  const xPoint = flowRight(xScale, x)
  const yPoint = flowRight(yScale, y)

  const [xFrom, xTo] = xScale.range()
  const lineAtY = isNumber(average) ? yPointMax - yScale(average) : 0

  return (
    <ScaleSVG width={clientWidth} height={clientHeight}>
      {isNumber(average) && (
        <Line
          from={new Point({ x: xFrom, y: lineAtY })}
          to={new Point({ x: xTo, y: lineAtY })}
          stroke="#eee"
          strokeWidth="1"
        />
      )}
      {data.map((d, index) => (
        <Bar
          key={key(index, d)}
          x={xPoint(d)}
          y={clientHeight - yPoint(d)}
          height={yPoint(d)}
          width={xScale.bandwidth()}
          fill={fill(d)}
        />
      ))}
      <AxisBottom scale={xScale} top={yPointMax} hideTicks />
    </ScaleSVG>
  )
}

export default enhance(AbnormalBarGraph)

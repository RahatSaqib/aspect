import React from 'react'
import { BarStack } from '@vx/shape'
import { scaleBand, scaleLinear, scaleOrdinal } from '@vx/scale'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { max } from 'd3-array'

const data = [
  {
    label: 'average',
    inactive: 610,
    active: 310,
  },
  {
    label: 'last 30 days',
    inactive: 545,
    active: 340,
  },
]
const keys = ['inactive', 'active']

// accessors
const x = d => d.label

const totals = data.map(cur => keys.reduce((count, k) => count + cur[k], 0))

// responsive utils for axis ticks
function numTicksForHeight(height) {
  if (height <= 300) return 3
  if (height > 300 && height <= 600) return 5
  return 10
}

function numTicksForWidth(width) {
  if (width <= 300) return 2
  if (width > 300 && width <= 400) return 5
  return 10
}

export const DashboardHCV = ({ width, height, margin }) => {
  if (width < 10) return null

  // bounds
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  // scales
  const xScale = scaleBand({
    rangeRound: [0, xMax],
    domain: data.map(x),
    padding: 0.4,
  })
  const yScale = scaleLinear({
    rangeRound: [yMax, 0],
    domain: [0, max(totals)],
  })
  const zScale = scaleOrdinal({
    domain: keys,
    range: ['#555555', '#FF5253'],
  })

  return (
    <svg width={width} height={height}>
      <BarStack
        top={margin.top}
        left={margin.left}
        data={data}
        keys={keys}
        height={yMax}
        x={x}
        xScale={xScale}
        yScale={yScale}
        zScale={zScale}
      />
      <AxisLeft
        top={margin.top}
        left={margin.left}
        scale={yScale}
        hideZero
        numTicks={numTicksForHeight(height)}
        stroke="#1b1a1e"
        tickLabelComponent={
          <text
            fill="#555555"
            textAnchor="end"
            fontSize={10}
            fontFamily="Arial"
            dx="-0.25em"
            dy="0.25em"
          />
        }
      />
      <AxisBottom
        top={height - margin.bottom}
        left={margin.left}
        scale={xScale}
        numTicks={numTicksForWidth(width)}
        stroke="#1b1a1e"
        tickStroke="#1b1a1e"
        tickLabelComponent={
          <text
            fill="#555555"
            textAnchor="middle"
            fontSize={10}
            fontFamily="Arial"
            dy="0.25em"
          />
        }
      />
    </svg>
  )
}

export default DashboardHCV

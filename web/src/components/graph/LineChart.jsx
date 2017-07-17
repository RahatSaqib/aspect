import React from 'react'
import PropTypes from 'prop-types'
import { Group } from '@vx/group'
import { LinePath } from '@vx/shape'
import { scaleTime, scaleLinear, scaleBand } from '@vx/scale'
import { extent, max } from 'd3-array'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { ScaleSVG } from '@vx/responsive'
import { Grid } from '@vx/grid'

const LineChart = props => {
  // programmed colors
  const c = ['#7d97bc', '#9874b2', '#3cc0cd', '#f36283']

  // set graph dimensions
  const width = 600 + props.styleWide * 300
  const height = 400
  const margin = { top: 30, bottom: 30, left: 60, right: 30 }

  // Shift over to align labels based on width
  const shift = 33 + props.styleWide * 17

  // Create bounds for graph
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  // Determine maximum number of lines
  const lengths = d => d.value.length
  const maxLines = Math.max(...props.data.map(lengths))

  // Array y holds each line based on data values
  const y = []
  for (let i = 0; i < maxLines; i++) {
    y[i] = d => d.value[i]
  }

  // draw lines for each linePath
  const series = props.data
  const data = series.reduce((rec, d) => rec.concat(d), [])

  // accessors
  const x = d => d.date

  // creates dynamic yAxis based on data
  const yAxis = d => Math.max(...d.value)

  let xScale
  if (props.timeStyle) {
    // scale based on time stamp
    xScale = scaleTime({
      range: [0, xMax],
      domain: extent(data, x),
    })
  } else {
    // scale evenly using labels
    xScale = scaleBand({
      rangeRound: [shift, xMax + shift], // number 20 aligns the line with the labels properly
      domain: props.data.map(x),
    })
  }

  // Scale the graph axes according to data
  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, max(data, yAxis) * 1.19],
  })

  // determine labelling based on props
  let labelSize = 15
  if (props.hideLabel) {
    labelSize = 0
  }

  // loop to render variable number of lines
  const lines = []
  for (let i = 0; i < maxLines; i++) {
    lines.push(
      <LinePath
        key={`bar-${i}`}
        data={data}
        xScale={xScale}
        yScale={yScale}
        x={x}
        y={y[i]}
        strokeWidth={props.lineSize}
        stroke={props.color[i] ? props.color[i] : c[i % 4]}
      />
    )
  }

  return (
    <ScaleSVG width={width} height={height}>
      <Group left={margin.left}>
        {props.gridLines &&
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            numTicksRows={3}
          />}
        {lines}
        <AxisLeft
          scale={yScale}
          stroke={'#1b1a1e'}
          tickTextFill={'#1b1a1e'}
          numTicks={props.numYTicks}
          hideTicks
          hideZero
          hideAxisLine={props.hideAxes}
          tickLabelComponent={
            <text
              textAnchor="end"
              fontSize={18}
              fill="black"
              dy="0.25em"
              fontFamily="arial"
            />
          }
        />
        <AxisBottom
          scale={xScale}
          top={yMax}
          left={-shift}
          hideTicks={props.hideTicks}
          hideAxisLine={props.hideAxes}
          tickTextFill={'#1b1a1e'}
          tickLabelComponent={
            <text textAnchor="middle" fontSize={labelSize} fill="black" />
          }
        />
      </Group>
    </ScaleSVG>
  )
}

LineChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  color: PropTypes.arrayOf(PropTypes.string),
  lineSize: PropTypes.number,
  numYTicks: PropTypes.number,
  styleWide: PropTypes.bool,
  hideLabel: PropTypes.bool,
  hideTicks: PropTypes.bool,
  hideAxes: PropTypes.bool,
  timeStyle: PropTypes.bool,
  gridLines: PropTypes.number,
}

LineChart.defaultProps = {
  hideLabel: true,
  hideTicks: true,
  hideAxes: true,
  color: [],
  timeStyle: false,
  lineSize: 5,
  gridLines: true,
  numYTicks: 3,
  styleWide: false,
}

export default LineChart

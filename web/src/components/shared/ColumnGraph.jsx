import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { scaleLinear, scaleBand } from '@vx/scale'
import { Group } from '@vx/group'
import { Bar } from '@vx/shape'
import { AxisLeft, AxisBottom, AxisRight } from '@vx/axis'
import { ScaleSVG } from '@vx/responsive'

class ColumnGraph extends Component {
  render() {
    function add(a, b) {
      return a + b
    }

    function barDisplacement(currBar, bar) {
      let total = 0
      for (let i = 0; i < currBar; i++) {
        total += bar[i]
      }
      return total
    }

    // Default colors for graph
    const c = ['#3cc0cd', '#7d97bc', '#9874b2', '#f36283']

    // Figure out label size
    const labelLength = d => d.name.length
    const maxLabel = Math.max(...this.props.data.map(labelLength))

    // Adjust margins based on label to improve visual
    let lMargin = maxLabel * 13 // 13 is a multiplier to properly scale margin by label
    let rMargin = 0
    if (this.props.hideLabel || this.props.rightLabel) {
      lMargin = 10
    }

    if (this.props.rightLabel) {
      rMargin = maxLabel * 12 // 12 is a multiplier to properly scale margin by label on right side
    }

    // Define the graph dimensions and margins
    const width = 600 + this.props.styleWide * 300
    const height = 400
    const margin = { top: 10, bottom: 20, left: lMargin, right: rMargin }

    // Create bounds for graph
    const xMax = width - margin.left - margin.right
    const yMax = height - margin.top - margin.bottom

    // Get y axis labels
    const y = d => d.name

    // Determine maximum data length
    const lengths = d => d.data.length
    const maxLength = Math.max(...this.props.data.map(lengths))

    // get x values based on data
    const x = []
    for (let i = 0; i < maxLength; i++) {
      x[i] = d => (d.data.length ? d.data[i] : 0)
    }

    // Create dynamic x axis
    const xAxis = d => d.data.reduce(add, 0)

    // Scale the graph based on data
    const yScale = scaleBand({
      rangeRound: [0, yMax],
      domain: this.props.data.map(y),
      padding: this.props.spacing,
    })
    const xScale = scaleLinear({
      rangeRound: [0, xMax],
      domain: [0, Math.max(...this.props.data.map(xAxis)) + 1.79],
      padding: 1,
    })

    // Compose together the scale and accessor functions to get point functions
    const compose = (scale, accessor) => data => scale(accessor(data))
    const yPoint = compose(yScale, y)

    const xPoint = []
    for (let i = 0; i < maxLength; i++) {
      xPoint[i] = compose(xScale, x[i])
    }

    // determine labelling based on props
    let labelSize = 25
    if (this.props.hideLabel) {
      labelSize = 0
    }

    const barLength = []

    return (
      <ScaleSVG width={width} height={height}>
        {this.props.data.map(d => {
          for (let j = 0; j < maxLength; j++) {
            barLength[j] = xPoint[j](d)
          }

          const bars = []
          for (let j = 0; j < maxLength; j++) {
            bars.push(
              <Bar
                key={`bar-${j}`}
                x={margin.left + barDisplacement(j, barLength)}
                y={yPoint(d)}
                height={yScale.bandwidth()}
                width={barLength[j]}
                fill={this.props.color[j] ? this.props.color[j] : c[j % 4]}
              />
            )
          }

          return (
            <Group className="barGraph" key={d.name}>
              {bars}
              {!this.props.rightLabel &&
                <AxisLeft
                  scale={yScale}
                  top={0}
                  left={margin.left}
                  stroke={'#1b1a1e'}
                  tickTextFill={'#1b1a1e'}
                  numTicks={4}
                  hideTicks
                  hideZero
                  hideAxisLine={this.props.hideAxes}
                  tickLabelComponent={
                    <text
                      textAnchor="end"
                      fontSize={labelSize}
                      fill="black"
                      dy="0.25em"
                      fontFamily="lato"
                    />
                  }
                />}
              {this.props.rightLabel &&
                <AxisRight
                  scale={yScale}
                  top={0}
                  left={xMax}
                  stroke={'#1b1a1e'}
                  tickTextFill={'#1b1a1e'}
                  numTicks={4}
                  hideTicks
                  hideZero
                  hideAxisLine={this.props.hideAxes}
                  tickLabelComponent={
                    <text
                      textAnchor="start"
                      fontSize={labelSize}
                      fill="black"
                      dy="0.25em"
                      fontFamily="lato"
                    />
                  }
                />}
              {!this.props.hideAxes &&
                <AxisBottom
                  scale={xScale}
                  top={yMax}
                  left={margin.left}
                  hideTicks={this.props.hideTicks}
                  numTicks={3}
                  hideZero
                  tickLabelComponent={
                    <text
                      textAnchor="middle"
                      fontSize={this.props.numLabelSize}
                      fill="black"
                    />
                  }
                />}
            </Group>
          )
        })}
      </ScaleSVG>
    )
  }
}

ColumnGraph.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  hideLabel: PropTypes.bool.isRequired,
  rightLabel: PropTypes.bool.isRequired,
  color: PropTypes.arrayOf(PropTypes.string).isRequired,
  hideAxes: PropTypes.bool.isRequired,
  hideTicks: PropTypes.bool.isRequired,
  spacing: PropTypes.number.isRequired,
  numLabelSize: PropTypes.number.isRequired,
  styleWide: PropTypes.bool.isRequired,
}

export default ColumnGraph

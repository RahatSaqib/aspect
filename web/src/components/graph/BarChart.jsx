import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { scaleLinear, scaleBand } from '@vx/scale'
import { Group } from '@vx/group'
import { Bar } from '@vx/shape'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { ScaleSVG } from '@vx/responsive'

class BarChart extends Component {
  render() {
    function add(a, b) {
      return a + b
    }

    function barDisplacement(currBar, bar) {
      let total = 0
      for (let i = 0; i <= currBar; i++) {
        total += bar[i]
      }
      return total
    }

    // Set default colors in an array
    const c = ['#3cc0cd', '#7d97bc', '#9874b2', '#f36283']

    // Adjusts margin if labels are hidden
    let lMargin = 40
    if (this.props.hideAxes) {
      lMargin = 5
    }

    let bMargin = 40
    if (this.props.hideLabel) {
      bMargin = 0
    }

    // Define the graph dimensions and margins
    const width = 600 + this.props.styleWide * 300
    const height = 400
    const margin = { top: 0, bottom: bMargin, left: lMargin, right: 20 }

    // Create bounds
    const xMax = width - margin.left - margin.right
    const yMax = height - margin.top - margin.bottom

    // Get x axis data labels
    const x = d => d.name

    // Determine maximum data length
    const lengths = d => d.data.length
    const maxLength = Math.max(...this.props.data.map(lengths))

    // Array y holds each color bar based on data values
    const y = []
    for (let i = 0; i < maxLength; i++) {
      y[i] = d => _.get(d, ['data', i, 'cnt'], _.get(d, ['data', i], 0))
    }

    // Creates dynamic y axis
    const yAxis = d => d.data.reduce(add, 0)

    // Scale the graph axes according to data
    const xScale = scaleBand({
      rangeRound: [0, xMax],
      domain: this.props.data.map(x),
      padding: this.props.spacing,
    })
    const yScale = scaleLinear({
      rangeRound: [yMax, 0],
      domain: [0, Math.max(...this.props.data.map(yAxis)) + 1.79], // 1.79 helps fit number labels on y axis
      padding: 1,
    })

    // Compose together the scale and accessor functions to get point functions
    const xPoint = _.flowRight(xScale, x)

    const yPoint = []
    for (let i = 0; i < maxLength; i++) {
      yPoint[i] = _.flowRight(yScale, y[i])
    }

    // determine labelling based on props
    let labelSize = 18
    if (this.props.hideLabel) {
      labelSize = 0
    }

    return (
      <ScaleSVG width={width} height={height}>
        {this.props.data.map(d => {
          const barHeight = []
          for (let j = 0; j < maxLength; j++) {
            barHeight[j] = yMax - yPoint[j](d)
          }

          const bars = []
          for (let j = 0; j < maxLength; j++) {
            bars.push(
              <Bar
                key={`bar-${j}`}
                x={xPoint(d)}
                y={400 - barDisplacement(j, barHeight)}
                height={barHeight[j]}
                width={xScale.bandwidth()}
                fill={this.props.color[j] ? this.props.color[j] : c[j % 4]}
              />
            )
          }

          return (
            <Group left={margin.left} key={d.name}>
              {bars}
              {!this.props.hideAxes && (
                <AxisLeft
                  scale={yScale}
                  stroke="#1b1a1e"
                  tickTextFill="#1b1a1e"
                  numTicks={this.props.numYTicks}
                  hideTicks={this.props.hideTicks}
                  hideZero
                  tickLabelComponent={
                    <text
                      textAnchor="end"
                      fontSize={this.props.numLabelSize}
                      fill="black"
                      dy="0.25em"
                      fontFamily="arial"
                    />
                  }
                />
              )}
              {(!this.props.hideAxes || this.props.xOnly) && (
                <AxisBottom
                  scale={xScale}
                  top={yMax}
                  hideTicks
                  tickLabelComponent={
                    <text
                      textAnchor="middle"
                      fontSize={labelSize}
                      fill="black"
                    />
                  }
                />
              )}
            </Group>
          )
        })}
      </ScaleSVG>
    )
  }
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  hideLabel: PropTypes.bool,
  color: PropTypes.arrayOf(PropTypes.string),
  hideAxes: PropTypes.bool,
  hideTicks: PropTypes.bool,
  spacing: PropTypes.number,
  numLabelSize: PropTypes.number,
  styleWide: PropTypes.bool,
  xOnly: PropTypes.bool,
  numYTicks: PropTypes.number,
}

BarChart.defaultProps = {
  hideLabel: true,
  hideTicks: true,
  hideAxes: false,
  color: [],
  spacing: 0.4,
  numLabelSize: 18,
  styleWide: false,
  xOnly: false,
  numYTicks: 4,
}

export default BarChart

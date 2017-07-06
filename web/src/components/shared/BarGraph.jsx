import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { scaleLinear, scaleBand } from '@vx/scale'
import { Group } from '@vx/group'
import { Bar } from '@vx/shape'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { ScaleSVG } from '@vx/responsive'

class BarGraph extends Component {
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

    // Define the graph dimensions and margins
    const width = 600
    const height = 400
    const margin = { top: 30, bottom: 0, left: 40, right: 20 }

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
      y[i] = d => (d.data.length ? d.data[i] : 0)
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
    const compose = (scale, accessor) => data => scale(accessor(data))
    const xPoint = compose(xScale, x)

    const yPoint = []
    for (let i = 0; i < maxLength; i++) {
      yPoint[i] = compose(yScale, y[i])
    }

    // determine labelling based on props
    let labelSize = 18
    const barHeight = []
    if (this.props.hideLabel) {
      labelSize = 0
    }

    return (
      <ScaleSVG width={width} height={height}>
        {this.props.data.map(d => {
          for (let j = 0; j < maxLength; j++) {
            barHeight[j] = yMax - yPoint[j](d)
          }

          const bars = []
          for (let j = 0; j < maxLength; j++) {
            bars.push(
              <Bar
                key={`bar-${j}`}
                x={margin.left + xPoint(d)}
                y={yMax - barDisplacement(j, barHeight)}
                height={barHeight[j]}
                width={xScale.bandwidth()}
                fill={this.props.color[j] ? this.props.color[j] : c[j % 4]}
              />
            )
          }

          return (
            <Group className="barGraph" key={d.name}>
              {bars}
              {this.props.showAxes &&
                <AxisLeft
                  scale={yScale}
                  top={0}
                  left={margin.left}
                  stroke={'#1b1a1e'}
                  tickTextFill={'#1b1a1e'}
                  numTicks={4}
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
                />}
              {this.props.showAxes &&
                <AxisBottom
                  scale={xScale}
                  top={yMax}
                  left={margin.left}
                  hideTicks
                  tickLabelComponent={
                    <text
                      textAnchor="middle"
                      fontSize={labelSize}
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

BarGraph.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  hideLabel: PropTypes.bool.isRequired,
  color: PropTypes.arrayOf(PropTypes.string).isRequired,
  showAxes: PropTypes.bool.isRequired,
  hideTicks: PropTypes.bool.isRequired,
  spacing: PropTypes.number.isRequired,
  numLabelSize: PropTypes.number.isRequired,
}

export default BarGraph

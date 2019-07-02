/* eslint-disable linebreak-style */
import React from 'react'
// import { compose, withProps, withHandlers } from 'recompose'
import { BarStack } from '@vx/shape'
import { Group } from '@vx/group'
import { Grid } from '@vx/grid'
import { AxisLeft, AxisBottom } from '@vx/axis'
// import { cityTemperature } from '@vx/mock-data'
import { scaleBand, scaleLinear, scaleOrdinal } from '@vx/scale'
import { timeParse, timeFormat } from 'd3-time-format'
import { withTooltip, Tooltip } from '@vx/tooltip'
import { LegendOrdinal } from '@vx/legend'

const axisColor = '#aaa'
const bg = '#eaedff'

const parseDate = timeParse('%Y%m%d')
const format = timeFormat('%b %d')
const formatDate = date => format(parseDate(date))

let tooltipTimeout

const VxChart = props => {
  const {
    data,
    indexBy,

    width = 1000,
    height = 400,
    margin = {
      top: 50,
      left: 60,
      right: 100,
    },
    // --- withTooltip ---
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = props

  const x = d => d[indexBy]
  const keys = ['hot dog', 'burger', 'sandwich', 'kebab', 'fries', 'donut']
  const totals = data.reduce((ret, cur) => {
    const t = keys.reduce((dailyTotal, k) => {
      dailyTotal += +cur[k]
      return dailyTotal
    }, 0)
    ret.push(t)
    return ret
  }, [])

  // scales
  const xScale = scaleBand({
    domain: data.map(x),
    padding: 0.2,
  })
  const yScale = scaleLinear({
    domain: [0, Math.max(...totals)],
    nice: true,
  })
  const color = scaleOrdinal({
    domain: keys,
    range: keys.map(key => data[0][`${key}Color`]),
  })

  // bounds
  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - 50

  xScale.rangeRound([0, xMax])
  yScale.range([yMax, 0])

  const axisProps = {
    stroke: 'transparent',
    tickStroke: axisColor,
  }
  const tickLabelProps = {
    fill: axisColor,
    fontSize: 11,
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill={bg} rx={14} />
        <Grid
          top={margin.top}
          left={margin.left}
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          xOffset={xScale.bandwidth() / 2}
        />
        <Group top={margin.top} left={margin.left}>
          <BarStack
            color={color}
            data={data}
            keys={keys}
            x={x}
            xScale={xScale}
            yScale={yScale}
          >
            {barStacks =>
              barStacks.map(barStack =>
                barStack.bars.map(bar => (
                  <rect
                    key={`bar-stack-${barStack.index}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    height={bar.height}
                    width={bar.width}
                    fill={bar.color}
                    onClick={() => {
                      alert(`clicked: ${JSON.stringify(bar)}`)
                    }}
                    onMouseLeave={() => {
                      tooltipTimeout = setTimeout(() => {
                        hideTooltip()
                      }, 300)
                    }}
                    onMouseMove={event => {
                      if (tooltipTimeout) clearTimeout(tooltipTimeout)
                      const top = event.clientY - margin.top - bar.height
                      const offset = (xScale.paddingInner() * xScale.step()) / 2
                      const left = bar.x + bar.width + offset
                      showTooltip({
                        tooltipData: bar,
                        tooltipTop: top,
                        tooltipLeft: left,
                      })
                    }}
                  />
                ))
              )
            }
          </BarStack>
        </Group>
        <Group left={margin.left} top={margin.top}>
          <AxisLeft
            {...axisProps}
            label="Count"
            scale={yScale}
            tickLabelProps={() => ({
              ...tickLabelProps,
              textAnchor: 'end',
              dx: '-0.25em',
              dy: '0.25em',
            })}
          />
          <AxisBottom
            {...axisProps}
            label="Country"
            scale={xScale}
            tickLabelProps={() => ({
              ...tickLabelProps,
              textAnchor: 'middle',
            })}
            top={yMax}
          />
        </Group>
      </svg>
      <div
        style={{
          position: 'absolute',
          top: margin.top / 2 - 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '12px',
        }}
      >
        <LegendOrdinal scale={color} direction="row" labelMargin="0 15px 0 0" />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: yMax + margin.top - data.length * 15 - 10,
          width: margin.right,
          display: 'flex',
          justifyContent: 'center',
          fontSize: '12px',
        }}
      >
        <LegendOrdinal
          scale={color}
          direction="column"
          // labelMargin="0 0 5px 0"
        />
      </div>
      {tooltipOpen && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            minWidth: 60,
            // backgroundColor: 'rgba(0,0,0,0.9)',
            // color: 'white',
            backgroundColor: 'rgba(255,255,255)',
            color: '#000',
            border: '1px solid #000',
          }}
        >
          <div style={{ color: color(tooltipData.key) }}>
            <strong>{tooltipData.key}</strong>
          </div>
          <div>{tooltipData.bar.data[tooltipData.key]}℉</div>
          <div>
            <small>{formatDate(x(tooltipData.bar.data))}</small>
          </div>
        </Tooltip>
      )}
    </div>
  )
}

export default withTooltip(VxChart)

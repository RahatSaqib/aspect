import _ from 'lodash'
import React from 'react'
import { compose, withProps, withHandlers } from 'recompose'
import { ScaleSVG } from '@vx/responsive'
import { Bar } from '@vx/shape'
import { Group } from '@vx/group'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { scaleBand, scaleLinear } from '@vx/scale'
import { withTooltip, Tooltip } from '@vx/tooltip'

const enhance = compose(
  withProps(
    ({
      clientWidth: width = 225,
      clientHeight: height = 225,
      margin: rawMargin,
      data,
    }) => {
      const margin = _.assign(
        {},
        { top: 20, bottom: 40, left: 30, right: 0 },
        rawMargin
      )
      const xMax = width
      const yMax = height - margin.top - margin.bottom

      const x = it => it.siteId
      const y = it => it.minRemainingDays

      return {
        width,
        height,
        margin,
        yMax,
        x,
        y,
        data,
        xScale: scaleBand({
          rangeRound: [0, xMax],
          domain: data.map(x),
          padding: 0.4,
        }),
        yScale: scaleLinear({
          rangeRound: [yMax, 0],
          nice: true,
          domain: [
            0,
            _.get(_.maxBy(data, 'minRemainingDays'), 'minRemainingDays', 0),
          ],
        }),
        barFill: d =>
          y(d) > 30
            ? process.env['--aspect-color-shakespeare']
            : process.env['--aspect-color-mandy'],
        axisLeftTickLabelFill: process.env['--aspect-color-chill-blue-2'],
      }
    }
  ),
  withTooltip,
  withHandlers(() => {
    let tooltipTimeout

    return {
      onMouseLeave: ({ hideTooltip }) => () => () => {
        tooltipTimeout = setTimeout(() => {
          hideTooltip()
        }, 300)
      },
      onMouseMove: ({ showTooltip }) => data => () => {
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout)
        }
        showTooltip({
          tooltipData: {
            key: data.siteId,
            data,
          },
          tooltipTop: 0,
          tooltipLeft: 70,
        })
      },
    }
  })
)

const InventorySiteSummaryBar = ({
  data,
  // --- withProps ---
  width,
  height,
  margin,
  yMax,
  x,
  y,
  xScale,
  yScale,
  barFill,
  axisLeftTickLabelFill,
  // --- withTooltip ---
  tooltipOpen,
  tooltipLeft,
  tooltipTop,
  tooltipData,
  // --- withHandlers ---
  onMouseLeave,
  onMouseMove,
}) => (
  <div style={{ position: 'relative' }}>
    <ScaleSVG width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        {data.map(d => {
          const barHeight = yMax - yScale(y(d))
          return (
            <Group key={`bar-${x(d)}`}>
              <Bar
                width={xScale.bandwidth()}
                height={barHeight}
                x={xScale(x(d))}
                y={yMax - barHeight}
                data={d}
                fill={barFill(d)}
                onMouseLeave={onMouseLeave}
                onMouseMove={onMouseMove}
              />
            </Group>
          )
        })}
      </Group>
      <AxisLeft
        top={margin.top}
        left={margin.left}
        scale={yScale}
        stroke={process.env['--aspect-color-grey-2']}
        tickLabelProps={() => ({
          fill: axisLeftTickLabelFill,
          textAnchor: 'end',
          fontSize: 16,
          dy: '0.25em',
        })}
      />
      <AxisBottom
        top={margin.top + yMax}
        left={margin.left}
        scale={xScale}
        stroke={process.env['--aspect-color-grey-2']}
        tickFormat={_.noop}
        label={`${data.length} Sites`}
        labelOffset={-10}
        labelProps={{
          textAnchor: 'middle',
          fontFamily: 'lato',
          fontSize: 16,
          fill: 'black',
        }}
      />
    </ScaleSVG>
    {tooltipOpen && (
      <Tooltip
        top={margin.top + tooltipTop}
        left={margin.left + tooltipLeft}
        style={{
          minWidth: 60,
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
        }}
      >
        <div>
          <strong style={{ color: barFill(tooltipData.data) }}>
            {y(tooltipData.data)}
          </strong>
        </div>
        <div>
          <small>{tooltipData.data.siteName}</small>
        </div>
      </Tooltip>
    )}
  </div>
)

export default enhance(InventorySiteSummaryBar)

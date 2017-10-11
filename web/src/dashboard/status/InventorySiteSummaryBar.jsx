import _ from 'lodash'
import React from 'react'
import { compose, withProps, pure } from 'recompose'
import { ScaleSVG } from '@vx/responsive'
import { Bar } from '@vx/shape'
import { Group } from '@vx/group'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { scaleBand, scaleLinear } from '@vx/scale'

const enhance = compose(
  pure,
  withProps(
    ({
      clientWidth: width = 225,
      clientHeight: height = 225,
      margin: rawMargin,
      list,
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
      const data = list.toJS()

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
      }
    }
  )
)

const InventorySiteSummaryBar = ({
  width,
  height,
  margin,
  yMax,
  x,
  y,
  data,
  xScale,
  yScale,
}) => (
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
              fill={y(d) > 30 ? '#36AEDB' : '#EB4D62'}
            />
          </Group>
        )
      })}
    </Group>
    <AxisLeft
      top={margin.top}
      left={margin.left}
      scale={yScale}
      stroke="#1b1a1e"
      tickLabelProps={() => ({
        fill: '#8e205f',
        textAnchor: 'end',
        fontSize: 16,
        dy: '0.25em',
      })}
    />
    <AxisBottom
      scale={xScale}
      top={margin.top + yMax}
      left={margin.left}
      stroke="#a44afe"
      tickFormat={_.noop}
      label={`${data.length} Sites`}
      labelOffset={-10}
      labelProps={{
        textAnchor: 'middle',
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 'black',
      }}
    />
  </ScaleSVG>
)

export default enhance(InventorySiteSummaryBar)

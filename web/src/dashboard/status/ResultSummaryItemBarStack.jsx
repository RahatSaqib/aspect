import _ from 'lodash'
import React from 'react'
import { compose, withProps, pure } from 'recompose'
import { ScaleSVG } from '@vx/responsive'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { BarStack } from '@vx/shape'
import { LegendOrdinal } from '@vx/legend'
import { scaleBand, scaleLinear, scaleOrdinal } from '@vx/scale'

const enhance = compose(
  pure,
  withProps(
    ({
      clientWidth: width = 300,
      clientHeight: height = 500,
      margin: rawMargin,
      item,
    }) => {
      const margin = _.assign(
        {},
        { top: 0, bottom: 60, left: 30, right: 0 },
        rawMargin
      )
      const stackTop = 150
      const xMax = width
      const yMax = height - stackTop - margin.bottom

      const data = item.get('data').sortBy(it => -1 * it.get('total'))

      return {
        assayTypeName: item.get('assayTypeName'),
        width,
        height,
        margin,
        stackTop,
        stackHeight: yMax,
        data: data.toJS(),
        keys: item.get('resultCategory1LabelList').toJS(),
        xScale: scaleBand({
          rangeRound: [0, xMax],
          domain: data.map(it => it.get('siteName')).toJS(),
          padding: 0.4,
        }),
        yScale: scaleLinear({
          rangeRound: [yMax, 0],
          nice: true,
          domain: [0, _.max(data.map(it => it.get('total')).toJS())],
        }),
        zScale: scaleOrdinal({
          domain: item.get('resultCategory1LabelList').toJS(),
          range: [
            '#36AEDB',
            '#FDB100',
            '#90949D',
            '#69D73D',
            '#9B71B5',
            '#EB4D62',
          ],
        }),
      }
    }
  )
)

const ResultSummaryItemBarStack = ({
  assayTypeName,
  width,
  height,
  margin,
  stackTop,
  stackHeight,
  data,
  keys,
  xScale,
  yScale,
  zScale,
}) =>
  <div style={{ position: 'relative' }}>
    <h1 style={{ fontSize: 20 }}>
      {assayTypeName}
    </h1>
    <ScaleSVG width={width} height={height}>
      <BarStack
        top={margin.top + stackTop}
        left={margin.left}
        data={data}
        keys={keys}
        height={stackHeight}
        x={it => it.siteName}
        xScale={xScale}
        yScale={yScale}
        zScale={zScale}
      />
      <AxisLeft
        top={margin.top + stackTop}
        left={margin.left}
        scale={yScale}
        stroke="#1b1a1e"
        tickLabelProps={() => ({
          fill: '#8e205f',
          textAnchor: 'end',
          fontSize: 20,
          dx: '-0.25em',
          dy: '0.25em',
        })}
      />
      <AxisBottom
        scale={xScale}
        top={stackTop + stackHeight}
        left={margin.left}
        stroke="#a44afe"
        tickFormat={_.noop}
        label={
          <text
            textAnchor="middle"
            fontFamily="Arial"
            fontSize={20}
            fill="black"
          >
            {`${data.length} Sites`}
          </text>
        }
      />
    </ScaleSVG>
    <div
      style={{
        position: 'absolute',
        top: 20,
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        fontSize: '14px',
      }}
    >
      <LegendOrdinal
        scale={zScale}
        direction="column"
        labelMargin="0 15px 0 0"
      />
    </div>
  </div>

export default enhance(ResultSummaryItemBarStack)

import _ from 'lodash'
import React from 'react'
import { compose, withProps, withHandlers } from 'recompose'
import { ScaleSVG } from '@vx/responsive'
import { BarStack } from '@vx/shape'
import { LegendOrdinal } from '@vx/legend'
import { scaleBand, scaleLinear, scaleOrdinal } from '@vx/scale'
import { withTooltip, Tooltip } from '@vx/tooltip'
import {
  CustomizedAxisLeft,
  CustomizedAxisBottom,
} from '../../components/graph/CustomizedAxis'

const colorByResultCategoryExternalId = {
  Detected: process.env['--aspect-color-shakespeare'],
  NotDetected: process.env['--aspect-color-mantis'],
  Indeterminate: process.env['--aspect-color-mountain'],
  Invalid: process.env['--aspect-color-supernova'],
  NoResult: process.env['--aspect-color-grey-3'],
  Error: process.env['--aspect-color-mandy'],
}

const enhance = compose(
  withProps(
    ({
      clientWidth: width = 300,
      clientHeight: height = 500,
      margin: rawMargin,
      item,
    }) => {
      const margin = _.assign(
        {},
        { top: 0, bottom: 60, left: 40, right: 0 },
        rawMargin
      )
      const stackTop = 150
      const xMax = width
      const yMax = height - stackTop - margin.bottom

      const x = it => it.siteId
      const y = it => it.total
      const z = it => it.externalId

      const keys = item.resultCategories.map(z)

      return {
        width,
        height,
        margin,
        stackTop,
        stackHeight: yMax,
        keys,
        x,
        y,
        z,
        xScale: scaleBand({
          rangeRound: [0, xMax],
          domain: item.data.map(x),
          padding: 0.4,
        }),
        yScale: scaleLinear({
          rangeRound: [yMax, 0],
          nice: true,
          domain: [0, y(_.maxBy(item.data, y))],
        }),
        zScale: scaleOrdinal({
          domain: keys,
          range: keys.map(it => colorByResultCategoryExternalId[it]),
        }),
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
      onMouseMove: ({ showTooltip }) => tooltipData => () => {
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout)
        }
        showTooltip({
          tooltipData,
          tooltipTop: 100,
          tooltipLeft: 50,
        })
      },
    }
  })
)

const ResultSummaryItemBarStack = ({
  item,
  // --- withProps ---
  width,
  height,
  margin,
  stackTop,
  stackHeight,
  keys,
  x,
  y,
  z,
  xScale,
  yScale,
  zScale,
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
    <h1 style={{ fontSize: 20 }}>{item.assayTypeName}</h1>
    <ScaleSVG width={width} height={height}>
      <BarStack
        top={margin.top + stackTop}
        left={margin.left}
        data={item.data}
        keys={keys}
        height={stackHeight}
        x={x}
        xScale={xScale}
        yScale={yScale}
        zScale={zScale}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
      />
      <CustomizedAxisLeft
        top={margin.top + stackTop}
        left={margin.left}
        scale={yScale}
        stroke={process.env['--aspect-color-grey-2']}
        tickLabelProps={() => ({
          fill: axisLeftTickLabelFill,
          textAnchor: 'end',
          fontSize: 20,
          dy: '0.25em',
        })}
      />
      <CustomizedAxisBottom
        scale={xScale}
        top={stackTop + stackHeight}
        left={margin.left}
        stroke={process.env['--aspect-color-grey-2']}
        tickFormat={_.noop}
        label={`${item.data.length} Sites`}
        labelProps={{
          textAnchor: 'middle',
          fontFamily: 'lato',
          fontSize: 20,
          fill: 'black',
        }}
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
        domain={item.resultCategories}
        scale={zScale}
        labelTransform={_.constant((datum, index) => ({
          datum,
          index,
          text: datum.name,
          value: zScale(z(datum)),
        }))}
        direction="column"
        labelMargin="0 15px 0 0"
      />
    </div>
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
          <strong style={{ color: zScale(tooltipData.key) }}>
            {tooltipData.key} {tooltipData.data[tooltipData.key]}
          </strong>
          {' / '}
          <em style={{ color: axisLeftTickLabelFill }}>
            {y(tooltipData.data)}
          </em>
        </div>
        <div>
          <small>{tooltipData.data.siteName}</small>
        </div>
      </Tooltip>
    )}
  </div>
)

export default enhance(ResultSummaryItemBarStack)

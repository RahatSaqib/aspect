import _ from 'lodash'
import React from 'react'
import { compose, withProps, pure } from 'recompose'
import { ScaleSVG } from '@vx/responsive'
import { BarStack } from '@vx/shape'
import { LegendOrdinal } from '@vx/legend'
import { scaleBand, scaleLinear, scaleOrdinal } from '@vx/scale'
import {
  CustomizedAxisLeft,
  CustomizedAxisBottom,
} from '../../components/graph/CustomizedAxis'

const colorByResultCategoryExternalId = {
  Detected: '#36AEDB',
  NotDetected: '#69D73D',
  Indeterminate: '#9B71B5',
  Invalid: '#FDB100',
  NoResult: '#90949D',
  Error: '#EB4D62',
}

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
        { top: 0, bottom: 60, left: 40, right: 0 },
        rawMargin
      )
      const stackTop = 150
      const xMax = width
      const yMax = height - stackTop - margin.bottom

      const data = item.get('data').sortBy(it => -1 * it.get('total'))
      const keys = item.get('resultCategories').map(it => it.get('externalId'))

      return {
        assayTypeName: item.get('assayTypeName'),
        width,
        height,
        margin,
        stackTop,
        stackHeight: yMax,
        data: data.toJS(),
        keys: keys.toJS(),
        resultCategories: item.get('resultCategories').toJS(),
        xScale: scaleBand({
          rangeRound: [0, xMax],
          domain: data.map(it => it.get('siteId')).toJS(),
          padding: 0.4,
        }),
        yScale: scaleLinear({
          rangeRound: [yMax, 0],
          nice: true,
          domain: [0, _.max(data.map(it => it.get('total')).toJS())],
        }),
        zScale: scaleOrdinal({
          domain: keys.toJS(),
          range: item
            .get('resultCategories')
            .map(it => colorByResultCategoryExternalId[it.get('externalId')])
            .toJS(),
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
  resultCategories,
  xScale,
  yScale,
  zScale,
}) => (
  <div style={{ position: 'relative' }}>
    <h1 style={{ fontSize: 20 }}>{assayTypeName}</h1>
    <ScaleSVG width={width} height={height}>
      <BarStack
        top={margin.top + stackTop}
        left={margin.left}
        data={data}
        keys={keys}
        height={stackHeight}
        x={it => it.siteId}
        xScale={xScale}
        yScale={yScale}
        zScale={zScale}
      />
      <CustomizedAxisLeft
        top={margin.top + stackTop}
        left={margin.left}
        scale={yScale}
        stroke="#1b1a1e"
        tickFormat={value => (Math.floor(value) === value ? `${value}` : '')}
        tickLabelProps={() => ({
          fill: '#8e205f',
          textAnchor: 'end',
          fontSize: 20,
          dy: '0.25em',
        })}
      />
      <CustomizedAxisBottom
        scale={xScale}
        top={stackTop + stackHeight}
        left={margin.left}
        stroke="#a44afe"
        tickFormat={_.noop}
        label={`${data.length} Sites`}
        labelProps={{
          textAnchor: 'middle',
          fontFamily: 'Arial',
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
        domain={resultCategories}
        scale={zScale}
        labelTransform={_.constant((datum, index) => ({
          datum,
          index,
          text: datum.name,
          value: zScale(datum.externalId),
        }))}
        direction="column"
        labelMargin="0 15px 0 0"
      />
    </div>
  </div>
)

export default enhance(ResultSummaryItemBarStack)

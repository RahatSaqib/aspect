import React, { Fragment } from 'react'
import { line } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import classnames from 'classnames/bind'

import { generateTickValues } from '../Helpers/Formatters'
import styles from './AspectResponsiveBar.css'

const cssClasses = classnames.bind(styles)

// ----------------------------------------------------------
const AxisRight = barGraphProps => {
  const {
    data,
    width,
    height,
    baseConfig: { axisRightProps: { fieldName } = {} },
  } = barGraphProps
  const lineGenerator = line()
    .x(it => it.x)
    .y(it => it.y)

  const tickValuesYShape = 'twos'
  const tickValues = generateTickValues(
    data,
    tickValuesYShape,
    [fieldName],
    'Y',
    true
  )

  const minValue = tickValues[0]
  const maxValue = tickValues[tickValues.length - 1]
  const yScale = scaleLinear().domain([minValue, maxValue]).range([height, 0])

  const lineColor = 'transparent'

  return (
    <Fragment>
      <path
        d={lineGenerator([
          { x: width, y: 0 },
          { x: width, y: height },
        ])}
        fill="none"
        stroke={lineColor}
        style={{ pointerEvents: 'none' }}
      />

      <g transform={`translate(${width}, 0)`}>
        {tickValues.map(y => (
          <g transform={`translate(0, ${yScale(y)})`} key={y}>
            <line
              x1={0}
              x2={5}
              y1={0}
              y2={0}
              className={cssClasses('aspectresponsivebar__tick-line')}
            />
            <text
              dominantBaseline="central"
              textAnchor="begin"
              transform="translate(10,0) rotate(0)"
              className={cssClasses('aspectresponsivebar__tick-text')}
            >
              {y}%
            </text>
          </g>
        ))}
      </g>
    </Fragment>
  )
}

export default AxisRight

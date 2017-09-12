import _ from 'lodash'
import React from 'react'
import { ScaleSVG } from '@vx/responsive'
import { Group } from '@vx/group'
import { GlyphDot } from '@vx/glyph'
import CountryMap from '../../components/graph/CountryMap'

const enhance = _.identity

const CountryWithPoints = ({
  clientWidth = 300,
  clientHeight = 300,
  countryIsoAlpha2Code,
  points = [],
  onMouseEnterPoint = _.noop,
  onMouseLeavePoint = _.noop,
  margin: rawMargin = {},
}) => {
  const margin = _.assign(
    {},
    { top: 10, bottom: 10, left: 10, right: 10 },
    rawMargin
  )

  const onMouseEnter = ({ target: { dataset: { pointId } } }) => {
    onMouseEnterPoint(pointId)
  }

  const onMouseLeave = ({ target: { dataset: { pointId } } }) => {
    onMouseLeavePoint(pointId)
  }

  return (
    <ScaleSVG width={clientWidth} height={clientHeight}>
      <CountryMap
        countryIsoAlpha2Code={countryIsoAlpha2Code}
        extent={[
          [margin.left, margin.top],
          [clientWidth - margin.right, clientHeight - margin.bottom],
        ]}
        projectionFunc={projection =>
          <Group>
            {points.map(point => {
              const [left, top] = projection([point.lng, point.lat])

              return (
                <GlyphDot
                  key={`point-${point.id}`}
                  data-point-id={point.id}
                  fill={point.fill}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  cx={left}
                  cy={top}
                  r={point.size}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                />
              )
            })}
          </Group>}
        fill={feature =>
          `#${feature.index % 10}${feature.index % 5}d${feature.index %
            7}e${feature.index % 10}`}
        stroke={_.constant('#ffffff')}
      />
    </ScaleSVG>
  )
}

export default enhance(CountryWithPoints)

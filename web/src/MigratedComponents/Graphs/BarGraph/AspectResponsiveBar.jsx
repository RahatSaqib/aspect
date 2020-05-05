import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { ResponsiveBar } from '@nivo/bar'
import IntlContext from '../Helpers/Context/i18n'
import { GraphLegend } from '../GraphLegend'
import GraphToolTip from '../GraphToolTip'

import {
  formatValuesForGraphs,
  generateColorForValue,
  generateMargin,
  generateTickValues,
  generateToolTip,
  generateLegend,
  getMaxValueForDivergent,
} from '../Helpers/Formatters'

const AspectResponsiveBar = ({
  assaysFromState,
  culture,
  data,
  displayLegend,
  displayMethod,
  indexBy,
  keys,
  tickValuesY,
  tickValuesX,
  type,
}) => {
  const yTickvalues = generateTickValues(
    data,
    tickValuesY,
    keys,
    'Y',
    culture,
    false
  )
  const xTickValues = generateTickValues(
    data,
    tickValuesX,
    indexBy,
    'X',
    culture,
    false
  )

  const divergent =
    type === 'divergent'
      ? {
          ...getMaxValueForDivergent(data, 'value'),
          layout: 'horizontal',
        }
      : {}

  const legends = displayLegend
    ? [
        {
          dataFrom: 'keys',
          data: keys && keys.map(k => generateLegend(k, assaysFromState)),
          anchor: 'bottom-right',
          direction: 'row',
          justify: false,
          translateX: -25,
          translateY: 60,
          itemsSpacing: 2,
          itemWidth: 120,
          itemHeight: 20,
          itemDirection: 'right-to-left',
          itemOpacity: 0.85,
          symbolSize: 20,
          symbolShape: 'circle',
          effects: [
            {
              on: 'hover',
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]
    : []

  return (
    <IntlContext.Consumer>
      {({ formatNumber }) => {
        return (
          <ResponsiveBar
            data={data}
            keys={keys}
            indexBy={indexBy}
            colorBy="index"
            enableLabel={false}
            enableGridY={false}
            {...divergent}
            padding={0.3}
            borderWidth={0}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            labelSkipWidth={12}
            labelSkipHeight={12}
            animate
            motionStiffness={90}
            motionDamping={15}
            layers={['grid', 'axes', 'bars', 'markers', GraphLegend]}
            colors={v => generateColorForValue(v)}
            margin={generateMargin(tickValuesY, displayLegend)}
            tooltip={v => (
              <GraphToolTip
                values={generateToolTip(
                  v,
                  culture,
                  displayMethod,
                  assaysFromState,
                  formatNumber
                )}
              />
            )}
            axisLeft={{
              tickSize: 5,
              tickValues: yTickvalues,
              format: v =>
                formatValuesForGraphs(v, displayMethod, formatNumber),
            }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 10,
              tickRotation: 0,
              legendPosition: 'middle',
              legendOffset: 32,
              tickValues: xTickValues,
              format: v =>
                formatValuesForGraphs(v, displayMethod, formatNumber),
            }}
            legends={legends}
          />
        )
      }}
    </IntlContext.Consumer>
  )
}

AspectResponsiveBar.defaultProps = {
  tickValuesY: 'all',
  tickValuesX: 'all',
  type: 'bar',
}

AspectResponsiveBar.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  culture: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayLegend: PropTypes.bool.isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  indexBy: PropTypes.string.isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  tickValuesY: PropTypes.oneOf(['bookends', 'clubsandwich', 'all', 'none']),
  tickValuesX: PropTypes.oneOf(['bookends', 'all', 'none']),
  type: PropTypes.oneOf(['bar', 'stack', 'group']),
}

export default AspectResponsiveBar

import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { ResponsiveBar } from '@nivo/bar'

import { GraphLegend } from '../GraphLegend'
import GraphToolTip from '../GraphToolTip'

import {
  generateColorForValue,
  generateMargin,
  generateTickVales,
  generateToolTip,
  generateLegend,
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
}) => {
  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      colorBy="index"
      enableLabel={false}
      enableGridY={false}
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
          values={generateToolTip(v, culture, displayMethod, assaysFromState)}
        />
      )}
      axisLeft={{
        tickSize: 5,
        tickValues: generateTickVales(data, tickValuesY, keys, 'Y', true),
      }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 10,
        tickRotation: 0,
        legendPosition: 'middle',
        legendOffset: 32,
        tickValues: generateTickVales(data, tickValuesX, indexBy, 'X', false),
      }}
      legends={
        displayLegend
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
      }
    />
  )
}

AspectResponsiveBar.defaultProps = {
  tickValuesY: 'all',
  tickValuesX: 'all',
}

AspectResponsiveBar.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  culture: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayLegend: PropTypes.bool.isRequired,
  displayMethod: PropTypes.string.isRequired,
  indexBy: PropTypes.string.isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  tickValuesY: PropTypes.oneOf(['bookends', 'clubsandwich', 'all', 'none']),
  tickValuesX: PropTypes.oneOf(['bookends', 'all', 'none']),
}

export default AspectResponsiveBar

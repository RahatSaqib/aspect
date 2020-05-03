import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { ResponsiveBar } from '@nivo/bar'

import { GraphLegend } from '../GraphLegend'
import GraphToolTip from '../GraphToolTip'

import {
  generateColorForValue,
  generateMargin,
  generateTickValues,
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
  groupMode = 'grouped',
}) => {
  console.log(data)

  const newData = [
    {
      day: '1-10',
      Male: 14,
      Female: -7,
    },
    {
      day: '11-20',
      Male: 3,
      Female: -9,
    },
    {
      day: '21-30',
      Male: 8,
      Female: -4,
    },
    {
      day: '31-40',
      Male: 19,
      Female: -12,
    },
  ]

  return (
    <ResponsiveBar
      data={newData}
      keys={keys}
      indexBy={indexBy}
      colorBy="index"
      enableLabel={false}
      enableGridY={false}
      // fomr here
      layout="horizontal"
      minValue={-100}
      maxValue={100}
      // groupMode={groupMode}
      // to here
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
        tickValues: generateTickValues(
          data,
          tickValuesY,
          keys,
          'Y',
          culture,
          true
        ),
        format: v =>
          displayMethod === 'percentage'
            ? new Intl.NumberFormat(culture, {
                style: 'percent',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(Number(v / 100))
            : new Intl.NumberFormat(culture, {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(Number(v)),
      }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 10,
        tickRotation: 0,
        legendPosition: 'middle',
        legendOffset: 32,
        tickValues: generateTickValues(
          data,
          tickValuesX,
          indexBy,
          'X',
          culture,
          false
        ),
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
  groupMode: 'bar',
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
  groupMode: PropTypes.oneOf(['bar', 'stack', 'group']),
}

export default AspectResponsiveBar

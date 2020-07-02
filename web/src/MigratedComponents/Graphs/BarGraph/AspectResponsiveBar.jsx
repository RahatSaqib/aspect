import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { ResponsiveBar } from '@nivo/bar'
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
  data,
  displayLegend,
  displayMethod,
  indexBy,
  keys,
  tickValuesYShape,
  tickValuesXShape,
  type,
}) => {
  const { formatNumber: intlFormatNumber } = useIntl()
  const yTickvalues =
    type === 'divergent'
      ? generateTickValues(data, tickValuesXShape, indexBy, 'X')
      : generateTickValues(data, tickValuesYShape, keys, 'Y', true)
  const xTickValues = generateTickValues(data, tickValuesXShape, indexBy, 'X')
  const divergentExtraConfig =
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
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      colorBy="index"
      enableLabel={false}
      enableGridY={false}
      {...divergentExtraConfig}
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
      margin={generateMargin(tickValuesYShape, displayLegend)}
      tooltip={v => (
        <GraphToolTip
          values={generateToolTip(
            v,
            displayMethod,
            assaysFromState,
            intlFormatNumber
          )}
        />
      )}
      axisLeft={{
        tickSize: 5,
        tickValues: yTickvalues,
        format: v => formatValuesForGraphs(v, displayMethod, intlFormatNumber),
      }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 10,
        tickRotation: 0,
        legendPosition: 'middle',
        legendOffset: 32,
        tickValues: xTickValues,
        format: v => formatValuesForGraphs(v, displayMethod, intlFormatNumber),
      }}
      legends={legends}
    />
  )
}

AspectResponsiveBar.defaultProps = {
  tickValuesYShape: 'all',
  tickValuesXShape: 'all',
  type: 'bar',
}

AspectResponsiveBar.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayLegend: PropTypes.bool.isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  indexBy: PropTypes.string.isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  tickValuesYShape: PropTypes.oneOf([
    'bookends',
    'clubsandwich',
    'all',
    'none',
  ]),
  tickValuesXShape: PropTypes.oneOf(['bookends', 'all', 'none']),
  type: PropTypes.oneOf([
    'bar',
    'stacked',
    'group',
    'divergent',
    'barLegacyTreatment',
    'stackedDeviceTreatment',
  ]),
}

export default AspectResponsiveBar

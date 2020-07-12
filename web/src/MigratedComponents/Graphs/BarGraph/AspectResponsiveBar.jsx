import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { ResponsiveBar } from '@nivo/bar'
import { GraphLegend } from '../GraphLegend'
import { GraphToolTip, EmptyTooltip } from '../GraphToolTip'

import {
  formatValuesForGraphs,
  generateColorForValue,
  generateMargin,
  generateTickValues,
  generateToolTip,
  generateLegend,
  getMaxValueForDivergent,
} from '../Helpers/Formatters'

import { calcOverallRate } from '../Helpers/Formatters/calcs'

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
  const legendsNotToRender = ['weekendOrHoliday']
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
          data: keys.map(k => generateLegend(k, assaysFromState, type)),
          anchor: 'bottom-right',
          direction: 'row',
          justify: false,
          translateX: -25,
          translateY: 60,
          itemsSpacing: 2,
          itemWidth: 120,
          itemHeight: 20,
          itemDirection:
            type === 'stackedDeviceActivity'
              ? 'left-to-right'
              : 'right-to-left',
          itemOpacity: 0.85,
          symbolSize: 20,
          symbolShape: type === 'stackedDeviceActivity' ? 'square' : 'circle',
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
  console.log(data)

  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      colorBy="index"
      enableLabel={false}
      enableGridY={type === 'stackedDeviceActivity'}
      {...divergentExtraConfig}
      padding={type === 'stackedDeviceActivity' ? 0.03 : 0.3}
      borderWidth={0}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      labelSkipWidth={12}
      labelSkipHeight={12}
      animate
      motionStiffness={90}
      motionDamping={15}
      layers={['axes', 'bars', 'grid', 'markers', GraphLegend]}
      colors={v => generateColorForValue(v)}
      margin={generateMargin(tickValuesYShape, displayLegend, type)}
      tooltip={v =>
        v && legendsNotToRender.includes(v.id) ? (
          <EmptyTooltip />
        ) : (
          <GraphToolTip
            values={generateToolTip(
              v,
              displayMethod,
              assaysFromState,
              intlFormatNumber
            )}
          />
        )
      }
      axisLeft={{
        tickSize: 5,
        tickValues: yTickvalues,
        format: v => formatValuesForGraphs(v, displayMethod, intlFormatNumber),
        legendPosition: 'middle',
        legendOffset: -60,
        legend:
          type === 'stackedDeviceActivity'
            ? 'Percent of Monthly Status'
            : false,
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
      theme={
        type === 'stackedDeviceActivity' && {
          grid: {
            line: {
              stroke: 'white',
              strokeWidth: 2,
            },
          },
        }
      }
      markers={
        type === 'stackedDeviceActivity' && [
          {
            axis: 'y',
            value: calcOverallRate('devicesActiveRaw', 'devicesTotal', data),
            lineStyle: { stroke: 'rgba(32, 161, 179, 1)', strokeWidth: 3 },
            legendOrientation: 'horisontal',
            legend: `${calcOverallRate(
              'devicesActiveRaw',
              'devicesTotal',
              data
            ).toFixed(2)}%`,
            legendOffsetX: -3,
            legendOffsetY: 0,
            textStyle: {
              fill: 'rgba(32, 161, 179, 1)',
              fontWeight: 'bold',
            },
          },
        ]
      }
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
    'stackedDeviceActivity',
  ]),
}

export default AspectResponsiveBar

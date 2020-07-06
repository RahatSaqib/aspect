import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import difference from 'lodash/difference'
import sumBy from 'lodash/sumBy'
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
  const legendsNotToRender = ['isWeekendOrHoliday']
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
          data:
            keys &&
            difference(keys, legendsNotToRender).map(k =>
              generateLegend(k, assaysFromState, type)
            ),
          anchor: 'bottom-right',
          direction: 'row',
          justify: false,
          translateX: -25,
          translateY: 60,
          itemsSpacing: 2,
          itemWidth: 120,
          itemHeight: 20,
          itemDirection:
            type === 'stackedDeviceTreatment'
              ? 'left-to-right'
              : 'right-to-left',
          itemOpacity: 0.85,
          symbolSize: 20,
          symbolShape: type === 'stackedDeviceTreatment' ? 'square' : 'circle',
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

  const calcOverallRate = (keyToCalc, totalTotal, gData) => {
    const totalKey = sumBy(gData, d => Number(d[keyToCalc]))
    const total = sumBy(gData, d => Number(d[totalTotal]))
    const percentage = (totalKey / total) * 100
    console.log(totalKey, '--', total, percentage)
    return percentage
  }

  const markers = () => {
    if (type === 'stackedDeviceTreatment') {
      return [
        {
          axis: 'y',
          value: calcOverallRate('devicesActiveRaw', 'devicesTotal', data),
          lineStyle: { stroke: 'rgba(0, 0, 0, .35)', strokeWidth: 2 },
          legendOrientation: 'horisontal',
          legend: () => <div>The Label</div>,
          textStyle: {
            fill: 'red',
          },
        },
      ]
    }
  }

  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      colorBy="index"
      enableLabel={false}
      enableGridY={type === 'stackedDeviceTreatment'}
      {...divergentExtraConfig}
      padding={type === 'stackedDeviceTreatment' ? 0.03 : 0.3}
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
      margin={generateMargin(tickValuesYShape, displayLegend)}
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
        type === 'stackedDeviceTreatment' && {
          grid: {
            line: {
              stroke: 'white',
              strokeWidth: 2,
            },
          },
        }
      }
      markers={markers()}
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

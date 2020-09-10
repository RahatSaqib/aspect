import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { ResponsiveBar } from '@nivo/bar'
import { GraphLegend } from '../GraphLegend'
import { GraphToolTip, EmptyTooltip } from '../GraphToolTip'
import CustomBarGraphLegend from './CustomBarGraphLegend'

import {
  formatValuesForGraphs,
  generateColorForValue,
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
  const legendsNotToRender = []
  const graphsToHaveCustomLegend = [
    'bar',
    'stackedDeviceActivity',
    'barLegacyTreatment',
  ]
  const { formatNumber: intlFormatNumber } = useIntl()

  const config = (type, data, displayMethod) => {
    switch (true) {
      case type === 'divergent':
        return {
          legend: `Percent of Monthly Status: ${data[0].date.split(' ')[0]}`,
          yTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          extraConfig: {
            ...getMaxValueForDivergent(data, 'value'),
            layout: 'horisontal',
          },
          layout: 'horizontal',
          padding: 0.3,
          translateX: -25,
          itemWidth: 120,
          itemDirection: 'right-to-left',
          symbolShape: 'circle',
          theme: {},
          enableGridY: false,
          margin: { top: 5, right: 0, bottom: 60, left: 0 },
          markers: [],
        }

      case type === 'stackedDeviceActivity':
        return {
          legend: false,
          yTickValues: generateTickValues(
            data,
            tickValuesYShape,
            keys,
            'Y',
            true
          ),
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          extraConfig: {},
          padding: 0.03,
          translateX: 15,
          itemWidth: 140,
          itemDirection: 'left-to-right',
          symbolShape: 'square',
          theme: { grid: { line: { stroke: 'white', strokeWidth: 2 } } },
          enableGridY: true,
          margin: { top: 5, right: 70, bottom: 100, left: 70 },
          markers: [
            {
              axis: 'y',
              value: calcOverallRate('devicesActiveRaw', 'devicesTotal', data, {
                weekendOrHoliday: 0,
              }),
              lineStyle: { stroke: 'rgba(32, 161, 179, 1)', strokeWidth: 3 },
              legendOrientation: 'horisontal',
              legend: `${calcOverallRate(
                'devicesActiveRaw',
                'devicesTotal',
                data,
                { weekendOrHoliday: 0 }
              ).toFixed(0)}%`,
              legendOffsetX: -3,
              legendOffsetY: 0,
              textStyle: {
                fill: 'rgba(32, 161, 179, 1)',
                fontWeight: 'bold',
              },
            },
          ],
        }

      default:
        return {
          legend: false,
          yTickValues: generateTickValues(
            data,
            tickValuesYShape,
            keys,
            'Y',
            true
          ),
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          extraConfig: {},
          padding: 0.3,
          translateX: -25,
          itemWidth: 120,
          itemDirection: 'right-to-left',
          symbolShape: 'circle',
          theme: {},
          enableGridY: false,
          margin: { top: 5, right: 0, bottom: 60, left: 0 },
          markers: [],
        }
    }
  }

  const baseLegend =
    displayLegend && !graphsToHaveCustomLegend.includes(type)
      ? [
          {
            dataFrom: 'keys',
            data: keys.map(k =>
              generateLegend(k, assaysFromState, type, legendsNotToRender)
            ),
            anchor: 'bottom-right',
            direction: 'row',
            justify: false,
            translateX: config(type, data, displayMethod).translateX,
            translateY: 60,
            itemsSpacing: 2,
            itemWidth: config(type, data, displayMethod).itemWidth,
            itemHeight: 20,
            itemDirection: config(type, data, displayMethod).itemDirection,
            itemOpacity: 0.85,
            symbolSize: 20,
            symbolShape: config(type, data, displayMethod).symbolShape,
            effects: [{ on: 'hover', style: { itemOpacity: 1 } }],
          },
        ]
      : []

  const format = (v, displayMethod, intlFormatNumber) =>
    type === 'stackedDeviceActivity'
      ? v.replace(/\D/g, '')
      : formatValuesForGraphs(v, displayMethod, intlFormatNumber)

  return (
    <div style={{ height: '100%', maxHeight: '350px' }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        colorBy="index"
        enableLabel={false}
        enableGridY={config(type, data, displayMethod).enableGridY}
        {...config(type, data, displayMethod).extraConfig}
        padding={config(type, data, displayMethod).padding}
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
        margin={config(type, data, displayMethod).margin}
        tooltip={v =>
          v && legendsNotToRender.includes(v.id) ? (
            <EmptyTooltip title={v.id} />
          ) : (
            <GraphToolTip
              values={generateToolTip(
                v,
                displayMethod,
                assaysFromState,
                intlFormatNumber,
                type
              )}
            />
          )
        }
        axisLeft={{
          tickSize: 5,
          tickValues: config(type, data, displayMethod).yTickValues,
          format: v =>
            formatValuesForGraphs(v, displayMethod, intlFormatNumber),
          legendPosition: 'middle',
          legendOffset: -60,
          legend: config(type, data, displayMethod).legend,
        }}
        axisBottom={{
          tickSize: 5,
          tickValues: config(type, data, displayMethod).xTickValues,
          tickPadding: 10,
          tickRotation: 0,
          legendPosition: 'middle',
          legendOffset: 32,
          format: v => format(v, displayMethod, intlFormatNumber),
        }}
        legends={baseLegend}
        theme={config(type, data, displayMethod).theme}
        markers={config(type, data, displayMethod).markers}
      />
      {displayLegend && graphsToHaveCustomLegend.includes(type) ? (
        <CustomBarGraphLegend
          keys={keys}
          generateLegend={generateLegend}
          assaysFromState={assaysFromState}
          type={type}
          symbolShape={config(type, data, displayMethod).symbolShape}
          legendsNotToRender={legendsNotToRender}
        />
      ) : null}
    </div>
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

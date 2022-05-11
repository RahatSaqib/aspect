import React from 'react'
import PropTypes from 'prop-types'
import every from 'lodash/every'
import filter from 'lodash/filter'
import first from 'lodash/first'
import sortBy from 'lodash/sortBy'
import { ResponsiveBar } from '@nivo/bar'
import classnames from 'classnames/bind'

import useI18n from '../../../Hooks/i18n/useI18n'
import { GraphLegend } from '../GraphLegend'
import { GraphToolTip, EmptyTooltip } from '../GraphToolTip'
import CustomBarGraphLegend from './CustomBarGraphLegend'
import useGraphClickThrough from '../Hooks/useGraphClickThrough'
import messages from '../intlMessages'
import {
  formatValuesForGraphs,
  generateColorForValue,
  generateTickValues,
  generateToolTip,
  generateLegendIntl,
  getMaxValueForDivergent,
} from '../Helpers/Formatters'
import { negateTimeZoneOffset } from '../../../components/shared/DateTimeInput/utils/date'

import { calcOverallRate } from '../Helpers/Formatters/calcs'

import styles from './AspectResponsiveBar.css'

const cssClasses = classnames.bind(styles)

const AspectResponsiveBar = ({
  assaysFromState,
  config: baseConfig,
  data,
  displayLegend,
  displayMethod,
  indexBy,
  formatDate,
  legendsToPopover,
  legendsNotToRender,
  keys,
  tickValuesYShape,
  tickValuesXShape,
  type,
  i18nKeys,
}) => {
  const { setConfig } = useGraphClickThrough()
  const { format, formatNumber: intlFormatNumber, formatMessage } = useI18n()
  const graphsToHaveCustomLegend = [
    'bar',
    'stackedDeviceActivity',
    'barLegacyTreatment',
  ]
  const { id: graphId, sortByKeys } = baseConfig
  let filteredData = data
  if (sortByKeys?.length) {
    const firstDataItem = first(sortBy(data, sortByKeys))
    filteredData = filter(data, d =>
      every(sortByKeys, k => d[k] === firstDataItem[k])
    )
  }
  const generateConfig = (type, data) => {
    switch (true) {
      case type === 'divergent':
        return {
          legend: `Percent of Monthly Status: ${data[0].date.split(' ')[0]}`,
          ylegend: false,
          yTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          gridYValues: null,
          extraConfig: {
            ...getMaxValueForDivergent(data, 'value'),
            layout: 'horizontal',
          },
          layout: 'horizontal',
          padding: 0.3,
          translateX: -25,
          itemWidth: 120,
          itemDirection: 'right-to-left',
          symbolShape: 'circle',
          theme: {},
          enableGridY: false,
          enableGridX: false,
          layers: ['axes', 'bars', 'grid', 'markers', GraphLegend],
          margin: { top: 5, right: 0, bottom: 60, left: 0 },
          markers: [],
        }

      case type === 'barInventory': {
        const yAxisValues = generateTickValues(
          data,
          tickValuesYShape,
          keys,
          'Y',
          true
        )
        return {
          legend: formatMessage(messages.inventoryGraphStatusXAxisLegend),
          ylegend: formatMessage(messages.inventoryGraphStatusYAxisLegend),
          gridYValues: yAxisValues,
          enableGridY: true,
          yTickValues: yAxisValues,
          enableGridX: true,
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          translateX: -25,
          layers: ['markers', 'axes', 'grid', GraphLegend, 'bars'],
          extraConfig: {},
          itemWidth: 120,
          itemDirection: 'right-to-left',
          symbolShape: 'circle',
          padding: 0.3,
          margin: { top: 30, right: 0, bottom: 60, left: 100 },
          markers: [],
        }
      }
      case type === 'stackedDeviceActivity':
        return {
          legend: false,
          ylegend: false,
          yTickValues: generateTickValues(
            data,
            tickValuesYShape,
            keys,
            'Y',
            true
          ),
          gridYValues: null,
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          extraConfig: {},
          padding: 0.03,
          translateX: 15,
          itemWidth: 140,
          itemDirection: 'left-to-right',
          symbolShape: 'square',
          theme: { grid: { line: { stroke: 'white', strokeWidth: 2 } } },
          enableGridY: true,
          enableGridX: false,
          layers: ['axes', 'bars', 'grid', 'markers', GraphLegend],
          margin: { top: 5, right: 70, bottom: 100, left: 70 },
          markers: [
            {
              axis: 'y',
              value: calcOverallRate('devicesActiveRaw', 'devicesTotal', data, {
                weekendOrHoliday: 0,
              }),
              lineStyle: { stroke: 'rgba(32, 161, 179, 1)', strokeWidth: 3 },
              legendOrientation: 'horizontal',
              legend: `${calcOverallRate(
                'devicesActiveRaw',
                'devicesTotal',
                data,
                { weekendOrHoliday: 0 }
              ).toFixed(0)}%`,
              legendOffsetX: -30,
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
          ylegend: false,
          yTickValues: generateTickValues(
            data,
            tickValuesYShape,
            keys,
            'Y',
            true
          ),
          gridYValues: null,
          xTickValues: generateTickValues(data, tickValuesXShape, indexBy, 'X'),
          extraConfig: {},
          padding: 0.3,
          translateX: -25,
          itemWidth: 120,
          layers: ['axes', 'bars', 'grid', 'markers', GraphLegend],
          itemDirection: 'right-to-left',
          symbolShape: 'circle',
          theme: {
            axis: { ticks: { text: { fontSize: 14 } } },
          },
          enableGridY: false,
          enableGridX: false,
          margin: { top: 5, right: 0, bottom: 60, left: 0 },
          markers: [],
        }
    }
  }
  const {
    enableGridY,
    ylegend,
    yTickValues,
    gridYValues,
    enableGridX,
    translateX,
    xTickValues,
    extraConfig,
    itemDirection,
    itemWidth,
    layers,
    legend,
    markers,
    margin,
    padding,
    symbolShape,
    theme,
  } = generateConfig(type, filteredData)
  const baseLegend =
    displayLegend && !graphsToHaveCustomLegend.includes(type)
      ? [
          {
            dataFrom: 'keys',
            data: keys.map(k =>
              generateLegendIntl(
                formatMessage,
                messages,
                i18nKeys,
                k,
                assaysFromState,
                graphId,
                legendsNotToRender
              )
            ),
            anchor: 'bottom-right',
            direction: 'row',
            justify: false,
            translateX,
            translateY: 60,
            itemsSpacing: 2,
            itemWidth,
            itemHeight: 20,
            itemDirection,
            itemOpacity: 0.85,
            symbolSize: 20,
            symbolShape,
            effects: [{ on: 'hover', style: { itemOpacity: 1 } }],
          },
        ]
      : []
  const formatAxisLabel = (v, displayMethod, intlFormatNumber) =>
    type === 'stackedDeviceActivity'
      ? v.replace(/\D/g, '')
      : formatValuesForGraphs(v, displayMethod, intlFormatNumber)

  return (
    <div className={cssClasses('aspectresponsivebar__container')}>
      <div className={cssClasses('aspectresponsivebar__chart__container')}>
        <ResponsiveBar
          style={{ flex: 1 }}
          data={filteredData}
          keys={keys}
          indexBy={indexBy}
          colorBy="index"
          onClick={(value, event) => setConfig({ value, event, baseConfig })}
          enableLabel={false}
          enableGridY={enableGridY}
          enableGridX={enableGridX}
          gridYValues={gridYValues}
          {...extraConfig}
          padding={padding}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          labelSkipWidth={12}
          labelSkipHeight={12}
          animate
          motionStiffness={90}
          motionDamping={15}
          layers={layers}
          colors={v => generateColorForValue(v.id, graphId)}
          margin={margin}
          tooltip={v =>
            v && legendsNotToRender.includes(v.id) ? (
              <EmptyTooltip title={v.id} />
            ) : (
              <GraphToolTip
                clickThrough={(baseConfig && baseConfig.clickThrough) || false}
                displayMethod={displayMethod}
                values={generateToolTip(
                  v,
                  displayMethod,
                  assaysFromState,
                  intlFormatNumber,
                  type,
                  formatMessage,
                  messages,
                  i18nKeys
                )}
              />
            )
          }
          axisLeft={{
            tickSize: 5,
            tickValues: yTickValues,
            format: v =>
              formatValuesForGraphs(v, displayMethod, intlFormatNumber),
            legendPosition: 'middle',
            legendOffset: -60,
            legend,
          }}
          axisBottom={{
            legend: ylegend,
            tickSize: 5,
            tickValues: xTickValues,
            tickPadding: 10,
            tickRotation: 0,
            legendPosition: 'middle',
            legendOffset: 50,
            format: v =>
              v && formatDate === 'MMM'
                ? format(negateTimeZoneOffset(new Date(v)), formatDate)
                : formatAxisLabel(v, formatDate),
          }}
          legends={baseLegend}
          theme={theme}
          markers={markers}
        />
      </div>
      {displayLegend && graphsToHaveCustomLegend.includes(type) ? (
        <CustomBarGraphLegend
          style={{ flex: 1 }}
          keys={keys}
          generateLegendIntl={generateLegendIntl}
          i18nKeys={i18nKeys}
          assaysFromState={assaysFromState}
          type={type}
          graphId={graphId}
          symbolShape={symbolShape}
          legendsNotToRender={legendsNotToRender}
          legendsToPopover={legendsToPopover}
        />
      ) : null}
    </div>
  )
}

AspectResponsiveBar.defaultProps = {
  tickValuesYShape: 'all',
  tickValuesXShape: 'all',
  type: 'bar',
  formatDate: false,
  legendsToPopover: [],
  legendsNotToRender: [],
}

AspectResponsiveBar.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  displayLegend: PropTypes.bool.isRequired,
  displayMethod: PropTypes.oneOf(['percentage', 'actual']).isRequired,
  indexBy: PropTypes.string.isRequired,
  keys: PropTypes.oneOfType([PropTypes.array]).isRequired,
  formatDate: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  legendsToPopover: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  legendsNotToRender: PropTypes.oneOfType([PropTypes.array]),
  tickValuesYShape: PropTypes.oneOf([
    'bookends',
    'clubsandwich',
    'all',
    'none',
    'twos',
  ]),
  tickValuesXShape: PropTypes.oneOf(['bookends', 'all', 'none', 'twos']),
  type: PropTypes.oneOf([
    'bar',
    'stacked',
    'group',
    'divergent',
    'barLegacyTreatment',
    'stackedDeviceActivity',
    'barInventory',
  ]),
  i18nKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default AspectResponsiveBar

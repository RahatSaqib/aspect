import React from 'react'
import PropTypes from 'prop-types'
import every from 'lodash/every'
import filter from 'lodash/filter'
import first from 'lodash/first'
import sortBy from 'lodash/sortBy'
import isFunction from 'lodash/isFunction'
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
  getColorIdByFieldName,
} from '../Helpers/Formatters'
import { negateTimeZoneOffset } from '../../../components/shared/DateTimeInput/utils/date'

import { calcOverallRate } from '../Helpers/Formatters/calcs'

import styles from './AspectResponsiveBar.css'

const cssClasses = classnames.bind(styles)

// ----------------------------------------------------------
const normalizeData = (data, { sortByKeys }) => {
  let filteredData = data
  if (sortByKeys?.length) {
    const firstDataItem = first(sortBy(data, sortByKeys))
    filteredData = filter(data, d =>
      every(sortByKeys, k => d[k] === firstDataItem[k])
    )
  }
  return filteredData
}

// ----------------------------------------------------------
const graphsToHaveCustomLegend = [
  'bar',
  'stackedDeviceActivity',
  'barLegacyTreatment',
  'bar-line',
]

// ----------------------------------------------------------
const getLegend = (props, config, { formatMessage }) => {
  const {
    assaysFromState,
    config: baseConfig,
    displayLegend,
    legendsNotToRender,
    keys,
    type,
    i18nKeys,
  } = props
  const { id: graphId, fields } = baseConfig
  const { translateX, itemDirection, itemWidth, symbolShape } = config
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
                legendsNotToRender,
                {
                  colorExternalId: getColorIdByFieldName(fields, k),
                }
              )
            ),
            anchor: 'bottom',
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
  return baseLegend
}

// ----------------------------------------------------------
const formatAxisLabel = (v, type, displayMethod, i18n) => {
  if (isFunction(displayMethod)) {
    return displayMethod(v, i18n, { type })
  }
  return type === 'stackedDeviceActivity'
    ? v.replace(/\D/g, '')
    : formatValuesForGraphs(v, displayMethod, i18n)
}

/** ***********************************************************
 *
 * AspectResponsiveBar
 *
 ** *********************************************************** */
const AspectResponsiveBar = props => {
  const {
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
  } = props
  const { setConfig } = useGraphClickThrough()
  const i18n = useI18n()
  const { format, formatMessage } = i18n

  const { id: graphId, sortByKeys, groupMode, fields, layers = [] } = baseConfig
  const keysForBars = fields
    ? fields.filter(it => it.target === 'bar').map(it => it.name)
    : keys
  const filteredData = normalizeData(data, { sortByKeys })
  const generateConfig = (type, data) => {
    switch (true) {
      case type === 'divergent':
        return {
          legend: `Percent of Monthly Status: ${data[0].date.split(' ')[0]}`,
          ylegend: false,
          yTickValues: generateTickValues(
            data,
            tickValuesXShape,
            indexBy,
            'X',
            false
          ),
          xTickValues: generateTickValues(
            data,
            tickValuesXShape,
            indexBy,
            'X',
            false
          ),
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
          xTickValues: generateTickValues(
            data,
            tickValuesXShape,
            indexBy,
            'X',
            false
          ),
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
          xTickValues: generateTickValues(
            data,
            tickValuesXShape,
            indexBy,
            'X',
            false
          ),
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

      case type === 'bar-line': {
        const groupMode = 'grouped'
        const yAxisValues = generateTickValues(
          data,
          tickValuesYShape,
          keysForBars,
          'Y',
          true,
          { groupMode }
        )

        return {
          legend: false,
          ylegend: false,
          gridYValues: yAxisValues,
          enableGridY: true,
          yTickValues: yAxisValues,
          enableGridX: true,
          xTickValues: generateTickValues(
            data,
            tickValuesXShape,
            indexBy,
            'X',
            false
          ),
          extraConfig: {},
          padding: 0.3,
          translateX: -25,
          itemWidth: 120,
          layers: ['axes', 'grid', 'bars', 'markers', GraphLegend, ...layers],
          itemDirection: 'left-to-right',
          symbolShape: 'square',
          theme: {
            axis: { ticks: { text: { fontSize: 12 } } },
          },
          markers: [],
          groupMode,
          margin: { top: 40, right: 60, bottom: 60, left: 60 },
        }
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
          xTickValues: generateTickValues(
            data,
            tickValuesXShape,
            indexBy,
            'X',
            false
          ),
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
  const config = generateConfig(type, filteredData)
  const baseLegend = getLegend(props, config, { formatMessage })

  return (
    <div className={cssClasses('aspectresponsivebar__container')}>
      <div className={cssClasses('aspectresponsivebar__chart__container')}>
        <ResponsiveBar
          style={{ flex: 1 }}
          data={filteredData}
          keys={keysForBars}
          indexBy={indexBy}
          colorBy="index"
          onClick={(value, event) => setConfig({ value, event, baseConfig })}
          enableLabel={false}
          enableGridY={config.enableGridY}
          enableGridX={config.enableGridX}
          gridYValues={config.gridYValues}
          {...config.extraConfig}
          padding={config.padding}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          labelSkipWidth={12}
          labelSkipHeight={12}
          animate
          motionStiffness={90}
          motionDamping={15}
          layers={config.layers}
          baseConfig={baseConfig} // original graphType object to pass to layer
          groupMode={groupMode}
          colors={v => {
            let valueId = v.id
            if (fields) {
              ;[{ colorId: valueId }] = fields.filter(
                it => it.target === 'bar' && it.name === v.id
              )
            }
            return generateColorForValue(valueId, graphId)
          }}
          margin={config.margin}
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
                  i18n.formatNumber,
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
            tickValues: config.yTickValues,
            format: v => formatValuesForGraphs(v, displayMethod, i18n),
            legendPosition: 'middle',
            legendOffset: -60,
            legend: config.legend,
          }}
          axisBottom={{
            legend: config.ylegend,
            tickSize: 5,
            tickValues: config.xTickValues,
            tickPadding: 10,
            tickRotation: 0,
            legendPosition: 'middle',
            legendOffset: 50,
            format: v =>
              v && formatDate === 'MMM'
                ? format(negateTimeZoneOffset(new Date(v)), formatDate)
                : formatAxisLabel(v, type, formatDate, i18n),
          }}
          legends={baseLegend}
          theme={config.theme}
          markers={config.markers}
        />
      </div>
      {displayLegend && graphsToHaveCustomLegend.includes(type) ? (
        <CustomBarGraphLegend
          style={{ flex: 1 }}
          keys={keys}
          fields={fields}
          generateLegendIntl={generateLegendIntl}
          i18nKeys={i18nKeys}
          assaysFromState={assaysFromState}
          type={type}
          graphId={graphId}
          symbolShape={config.symbolShape}
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
  formatDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
    PropTypes.func,
  ]),
  legendsToPopover: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
    PropTypes.func,
  ]),
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
    'bar-line',
  ]),
  i18nKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default AspectResponsiveBar

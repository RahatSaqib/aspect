import React from 'react'
import PropTypes from 'prop-types'
import every from 'lodash/every'
import filter from 'lodash/filter'
import first from 'lodash/first'
import sortBy from 'lodash/sortBy'
import { ResponsiveLine } from '@nivo/line'
import classnames from 'classnames/bind'

import useI18n from '../../../Hooks/i18n/useI18n'
import { GraphLegend } from '../GraphLegend'
import { GraphToolTip, EmptyTooltip } from '../GraphToolTip'
import messages from '../intlMessages'
import {
  formatValuesForGraphs,
  generateColorForValue,
  generateTickValues,
  generateToolTip,
  // generateLegendIntl,
  getMaxValueForDivergent,
} from '../Helpers/Formatters'

import styles from './AspectResponsiveLine.css'

const cssClasses = classnames.bind(styles)

const AspectResponsiveLine = ({
  assaysFromState,
  config: baseConfig,
  data,
  displayLegend,
  displayMethod,
  indexBy,
  // formatDate,
  // legendsToPopover,
  legendsNotToRender,
  keys,
  tickValuesYShape,
  tickValuesXShape,
  type,
  i18nKeys,
}) => {
  const { formatNumber: intlFormatNumber, formatMessage } = useI18n()
  const graphsToHaveCustomLegend = []
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
      case type === 'line-trends':
        return {
          legend: 'legend-1', // `Percent of Monthly Status: ${data[0].date.split(' ')[0]}`,
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
          enableGridY: true,
          enableGridX: true,
          layers: ['axes', 'lines', 'grid', 'markers', GraphLegend],
          margin: { top: 7, right: 30, bottom: 70, left: 50 },
          markers: [],
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
    xTickValues,
    extraConfig,
    legend,
    markers,
    margin,
    padding,
    theme,
  } = generateConfig(type, filteredData)
  const baseLegend =
    displayLegend && !graphsToHaveCustomLegend.includes(type)
      ? [
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0, // 100,
            translateY: 70,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]
      : []

  return (
    <div className={cssClasses('aspect-responsive-line__container')}>
      <div className={cssClasses('aspect-responsive-line__chart__container')}>
        <ResponsiveLine
          style={{ flex: 1 }}
          data={filteredData}
          pointSize={10}
          pointColor={{ from: 'color' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh
          keys={keys}
          indexBy={indexBy}
          colorBy="index"
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
                  { ...v.point, value: v.point.data.y },
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
            format: v => {
              return formatValuesForGraphs(v, displayMethod, intlFormatNumber)
            },
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
            legendOffset: 0,
          }}
          legends={baseLegend}
          theme={theme}
          markers={markers}
        />
      </div>
    </div>
  )
}

AspectResponsiveLine.defaultProps = {
  tickValuesYShape: 'all',
  tickValuesXShape: 'all',
  type: 'bar',
  formatDate: false,
  legendsToPopover: [],
  legendsNotToRender: [],
}

AspectResponsiveLine.propTypes = {
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
  type: PropTypes.oneOf(['line-trends']),
  i18nKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default AspectResponsiveLine

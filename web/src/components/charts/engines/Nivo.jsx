/* eslint-disable linebreak-style */
import React from 'react'
import _ from 'lodash'
// import PropTypes from 'prop-types'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'

import UnknownChartType from './UnknownChartType'
import { CHART_TYPE } from '../constants'

const getDefaultSettings = chartType => {
  const common = {
    animate: true,
    borderColor: { from: 'color', modifiers: [['darker', 1.6]] },
    colors: { scheme: 'nivo' },
    labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    margin: { top: 20, right: 130, bottom: 50, left: 60 },
    motionStiffness: 90,
    motionDamping: 15,
    padding: 0.3,
  }
  const axesProps = {
    axisBottom: {
      orient: 'bottom',
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: '',
      legendOffset: 36,
      legendPosition: 'middle',
    },
    axisLeft: {
      orient: 'left',
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: '',
      legendOffset: -40,
      legendPosition: 'middle',
    },
  }
  switch (chartType) {
    case CHART_TYPE.BAR:
      return {
        ...common,
        ...axesProps,
      }
    case CHART_TYPE.LINE:
      return {
        ...common,
        ...axesProps,
        pointSize: 10,
        pointColor: { theme: 'background' },
        pointBorderWidth: 2,
        pointBorderColor: { from: 'serieColor' },
        pointLabel: 'y',
        pointLabelYOffset: -12,
        useMesh: true,
      }
    case CHART_TYPE.PIE:
      return {
        ...common,
        innerRadius: 0.5,
        padAngle: 0.7,
        cornerRadius: 3,
        radialLabelsSkipAngle: 10,
        radialLabelsTextXOffset: 6,
        radialLabelsTextColor: '#333333',
        radialLabelsLinkOffset: 0,
        radialLabelsLinkDiagonalLength: 16,
        radialLabelsLinkHorizontalLength: 24,
        radialLabelsLinkStrokeWidth: 1,
        radialLabelsLinkColor: { from: 'color' },
        slicesLabelsSkipAngle: 10,
        slicesLabelsTextColor: '#333333',
      }
    default:
      return common
  }
}

function getChartComponent({ chartType }) {
  switch (chartType) {
    case CHART_TYPE.BAR:
      // see https://nivo.rocks/bar/
      return ResponsiveBar
    case CHART_TYPE.LINE:
      // see https://nivo.rocks/line/
      return ResponsiveLine
    case CHART_TYPE.PIE:
      // see https://nivo.rocks/pie/
      return ResponsivePie
    default:
      return UnknownChartType
  }
}

function getChartProps(props) {
  const baseSettings = getDefaultSettings(props.chartType)
  const settings = _.defaultsDeep(props, baseSettings)

  return settings
}

export default props => {
  const chartProps = getChartProps(props)

  const Chart = getChartComponent(props)

  return <Chart {...chartProps} />
}

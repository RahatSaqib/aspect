import React, { useEffect, useState } from 'react'
import { ResponsivePie } from '@nivo/pie'
import classnames from 'classnames/bind'
import {
  formatDataForPie,
  getAverageFromData,
  sortByInputArray,
} from './Helpers'

const cssClasses = classnames.bind(require('./Graphs.css'))

const LegendIndicator = ({ averages, data }) => {
  const { title, key } = averages
  const [average, setAverage] = useState(0)

  useEffect(() => {
    if (!average && data) {
      const calculated = getAverageFromData(data, key, 'value')
      setAverage(calculated)
    }
  }, [average, data, key])

  return (
    <div className={cssClasses('legend__container')}>
      <div className={cssClasses('legend__average')}>{average}%</div>
      <div className={cssClasses('legend__title')}>{title}</div>
    </div>
  )
}

const PieGraph = ({
  data,
  indexBy,
  orderBy,
  resultCategory,
  legend,
  averages,
  colours,
}) => {
  const [graph, setGraph] = useState(false)

  useEffect(() => {
    if (!graph && data.length) {
      const formatted = formatDataForPie(data, resultCategory, indexBy, orderBy)
      const sorted = sortByInputArray(formatted, orderBy, 'id')
      setGraph(formatted)
    }
  }, [data, graph, indexBy, orderBy, resultCategory])

  return (
    <div className={cssClasses('pie__container')}>
      <ResponsivePie
        data={graph}
        keys={orderBy}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        innerRadius={0.85}
        enableRadialLabels={false}
        enableSlicesLabels={false}
        padAngle={-1}
        startAngle={-90}
        cornerRadius={3}
        colors={colours}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        radialLabelsSkipAngle={10}
        radialLabelsTextXOffset={6}
        radialLabelsTextColor="#333333"
        radialLabelsLinkOffset={0}
        radialLabelsLinkDiagonalLength={16}
        radialLabelsLinkHorizontalLength={24}
        radialLabelsLinkStrokeWidth={1}
        radialLabelsLinkColor={{ from: 'color' }}
        slicesLabelsSkipAngle={10}
        slicesLabelsTextColor="#333333"
        animate
        motionStiffness={90}
        motionDamping={15}
      />
      {averages && <LegendIndicator averages={averages} data={graph} />}
    </div>
  )
}

export default PieGraph

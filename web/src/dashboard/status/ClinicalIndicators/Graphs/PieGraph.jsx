import React, { Fragment, useEffect, useState } from 'react'
import { ResponsivePie } from '@nivo/pie'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'

import { formatDataForPie, getAverageFromData } from './Helpers'

const cssClasses = classnames.bind(require('./Graphs.css'))

const LegendIndicator = ({ averages, data }) => {
  const { title, key } = averages
  const [average, setAverage] = useState(0)

  useEffect(() => {
    if (!average && data) {
      const calculated = getAverageFromData(data, 'value')
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
  displayMethod,
  indexBy,
  orderBy,
  resultCategory,
  averages,
  componentClass,
  assayFromState,
  filter = false,
}) => {
  const [graph, setGraph] = useState(false)
  const [filterResults] = useState(filter)

  useEffect(() => {
    if (
      !graph &&
      data.length &&
      assayFromState &&
      Object.keys(assayFromState).length
    ) {
      const formatted = formatDataForPie(
        data,
        resultCategory,
        indexBy,
        assayFromState,
        displayMethod,
        filterResults
      )

      setGraph(formatted)
    }
  }, [
    data,
    graph,
    indexBy,
    orderBy,
    resultCategory,
    assayFromState,
    displayMethod,
    filterResults,
  ])

  return (
    <div className={cssClasses(componentClass)}>
      {graph && graph.length ? (
        <Fragment>
          <ResponsivePie
            data={graph}
            keys={orderBy}
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            innerRadius={0.85}
            enableRadialLabels={false}
            enableSlicesLabels={false}
            padAngle={-1}
            startAngle={-90}
            cornerRadius={3}
            colors={d => d.color}
            tooltipFormat={value =>
              `${Number(value)}${displayMethod === 'percentage' ? '%' : ''}`
            }
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
        </Fragment>
      ) : (
        <CircularProgress />
      )}
    </div>
  )
}

export default PieGraph

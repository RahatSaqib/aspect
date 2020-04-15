import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { ResponsiveBar } from '@nivo/bar'
import CircularProgress from '@material-ui/core/CircularProgress'

import {
  calcPercentageSplitBar,
  getKeysFromResults,
  groupByKey,
  normaliseKeys,
  translateKeys,
} from './Helpers'

const cssClasses = classnames.bind(require('./Graphs.css'))

const BarGraph = ({
  data,
  keys: keysFromProps = false,
  indexBy,
  orderBy,
  keyToConsume,
  formatDate,
  legend,
  componentClass,
  displayMethod,
  assayFromState,
  filter = false,
  intl,
}) => {
  const [graph, setGraph] = useState(false)
  const [keys, setKeys] = useState(false)
  const [filterResults] = useState(filter)

  useEffect(() => {
    if (!keysFromProps && graph) {
      const keys = getKeysFromResults(graph, indexBy, orderBy)
      setKeys(keys)
    }
  }, [graph, indexBy, keysFromProps, orderBy, intl])

  useEffect(() => {
    if (
      !graph &&
      data.length &&
      assayFromState &&
      Object.keys(assayFromState).length
    ) {
      const grouped = groupByKey(data, indexBy, keyToConsume, formatDate, intl)

      const normalised = normaliseKeys(grouped, filterResults, indexBy)

      const display =
        displayMethod === 'percentage'
          ? calcPercentageSplitBar(normalised, indexBy)
          : normalised

      const translated = translateKeys(display, assayFromState, true)

      setGraph([...translated])
    }
  }, [
    data,
    displayMethod,
    formatDate,
    graph,
    indexBy,
    keyToConsume,
    assayFromState,
    filterResults,
    intl,
  ])

  return (
    <div className={cssClasses(componentClass)}>
      {graph && graph.length ? (
        <ResponsiveBar
          data={graph}
          keys={keys}
          indexBy={indexBy}
          colors={d => d.data[`${d.id}Color`]}
          tooltipFormat={value =>
            displayMethod === 'percentage'
              ? `${Number(value).toFixed(2)}%`
              : intl.formatNumber(Number(value))
          }
          colorBy="index"
          enableLabel={false}
          enableGridY={false}
          margin={
            displayMethod === 'percentage'
              ? { top: 5, right: 10, bottom: 110, left: 80 }
              : { top: 10, right: 10, bottom: 110, left: 80 }
          }
          padding={0.3}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
            tickRotation: 0,
            legendPosition: 'middle',
            legendOffset: 32,
          }}
          axisLeft={
            displayMethod === 'percentage'
              ? null
              : {
                  format: v => intl.formatNumber(v),
                }
          }
          labelSkipWidth={12}
          labelSkipHeight={12}
          animate
          motionStiffness={90}
          motionDamping={15}
          legends={
            legend
              ? [
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'row',
                    justify: false,
                    translateX: -25,
                    translateY: 60,
                    itemsSpacing: 2,
                    itemWidth: 98,
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
          }
        />
      ) : (
        <CircularProgress />
      )}
    </div>
  )
}

export default BarGraph

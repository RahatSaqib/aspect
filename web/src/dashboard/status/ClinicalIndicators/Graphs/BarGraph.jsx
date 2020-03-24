import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { ResponsiveBar } from '@nivo/bar'

import {
  calcPercentageSplit,
  groupByKey,
  normaliseKeys,
  getKeysFromResults,
} from './Helpers'

const cssClasses = classnames.bind(require('./Graphs.css'))

const BarGraph = ({
  data,
  keys: keysFromProps = false,
  indexBy,
  orderBy,
  resultCategory,
  formatDate,
  legend,
  colors,
  componentClass,
  displayMethod,
}) => {
  const [graph, setGraph] = useState(false)
  const [keys, setKeys] = useState(false)

  useEffect(() => {
    if (!keysFromProps && graph) {
      const keys = getKeysFromResults(graph, indexBy, orderBy)
      setKeys(keys)
    }
  }, [graph, indexBy, keysFromProps, orderBy])

  useEffect(() => {
    if (!graph && data.length) {
      const grouped = groupByKey(data, indexBy, resultCategory, formatDate)
      const normalised = normaliseKeys(grouped)
      const display =
        displayMethod === 'percentage'
          ? calcPercentageSplit(normalised, indexBy)
          : normalised

      setGraph([...display])
    }
  }, [data, displayMethod, formatDate, graph, indexBy, resultCategory])

  return (
    <div className={cssClasses(componentClass)}>
      <ResponsiveBar
        data={graph}
        keys={keys}
        indexBy={indexBy}
        enableLabel={false}
        enableGridY={false}
        margin={{ top: 10, right: 25, bottom: 110, left: 50 }}
        padding={0.3}
        colors={colors}
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
        axisLeft={displayMethod === 'percentage' ? null : {}}
        labelSkipWidth={12}
        labelSkipHeight={12}
        animate
        motionStiffness={90}
        motionDamping={15}
        legends={
          legend && [
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'row',
              justify: false,
              translateX: -20,
              translateY: 60,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
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
        }
      />
    </div>
  )
}

export default BarGraph

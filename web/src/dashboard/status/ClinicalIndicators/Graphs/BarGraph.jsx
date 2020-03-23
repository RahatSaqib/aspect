import React, { useEffect, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'

import { groupByKey, normaliseKeys, getKeysFromResults } from './Helpers'

const BarGraph = ({
  data,
  keys: keysFromProps = false,
  indexBy,
  orderBy,
  resultCategory,
  formatDate,
  legend,
  colours,
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
      setGraph([...normaliseKeys(grouped)])
    }
  }, [data, formatDate, graph, indexBy, resultCategory])

  return (
    <ResponsiveBar
      data={graph}
      keys={keys}
      indexBy={indexBy}
      enableLabel={false}
      enableGridY={false}
      margin={{ top: 50, right: 50, bottom: 120, left: 50 }}
      padding={0.3}
      colors={colours}
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
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
            translateX: 0,
            translateY: 80,
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
  )
}

export default BarGraph

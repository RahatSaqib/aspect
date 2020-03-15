import React, { useState, useEffect } from 'react'
import { ResponsiveBar } from '@nivo/bar'

const NivoBarGraph = ({ data }) => {
  const [graphs, setGraphs] = useState(false)

  useEffect(() => {
    if (!graphs && data.length) {
      setGraphs({
        data,
        legendAxisBottom: null,
        indexBy: 'label',
      })
    }
  }, [data, graphs])

  if (graphs && graphs.data && graphs.data.length) {
    const { data, indexBy, legendAxisBottom } = graphs
    return (
      <ResponsiveBar
        data={data}
        keys={['>=1000', '41-999', '<=4']}
        indexBy={indexBy}
        enableLabel={false}
        enableGridY={false}
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        colorsBy={d => d.color}
        // colorsBy={{ ">=1000": "red", "41-999": "blue", "<=4": "green" }}
        // borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: legendAxisBottom,
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={null}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        animate
        motionStiffness={90}
        motionDamping={15}
      />
    )
  }
  return <span>Loading...</span>
}

export default NivoBarGraph

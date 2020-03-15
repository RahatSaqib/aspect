import React, { useState, useEffect } from 'react'
import { ResponsivePie } from '@nivo/pie'

// import { calcAverages, calcTotals } from '../Helpers/Formatters';

const pieContainer = {
  position: 'relative',
  width: '100%',
  height: '100%',
}

const pieOverlayLegend = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: '0',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '15px',
}

const pieOverlayLegendMain = {
  fontSize: '50px',
  fontWeight: '700',
}
const pieOverlayLegendSub = {
  fontSize: '14px',
  width: '40%',
  textAlign: 'center',
}

const PieMiddleLegend = ({ average }) => {
  return (
    <div style={pieOverlayLegend}>
      <div style={pieOverlayLegendMain}>{average}%</div>
      <div style={pieOverlayLegendSub}>Average Monthly Suppression Rate</div>
    </div>
  )
}

const NivoPieGraph = ({ data }) => {
  const [graphs, setGraphs] = useState(false)

  useEffect(() => {
    if (!graphs && data.length) {
      const newData = []

      data.map(d =>
        newData.push({
          id: d.resultCategory1,
          label: d.resultCategory1,
          value: d.cnt,
        })
      )

      //   const average = calcAverages(data, '<=4');
      //   const formatted = calcTotals(data, ['>=1000', '41-999', '<=4']);
      setGraphs({
        data: newData,
      })
    }
  }, [data, graphs])

  if (graphs && graphs.data) {
    const { data } = graphs
    // const { formatted, average } = data;

    return data && data.length ? (
      <div style={pieContainer}>
        <ResponsivePie
          data={data}
          enableRadialLabels={false}
          enableSlicesLabels={false}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          innerRadius={0.85}
          padAngle={0.7}
          cornerRadius={3}
          colors={{ scheme: 'nivo' }}
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
        {/* <PieMiddleLegend average={average} /> */}
      </div>
    ) : (
      <span>loading</span>
    )
  }
  return <span>Loading...</span>
}

export default NivoPieGraph

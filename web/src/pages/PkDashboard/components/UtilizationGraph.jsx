import React from 'react'
import { red, orange, yellow, green } from '@mui/material/colors'
import { ResponsiveBar } from '@nivo/bar'

// fill with color when value match condition
const fill = [
  { id: 'red', match: d => d.data.value <= 20 },
  { id: 'orange', match: d => d.data.value <= 30 },
  { id: 'yellow', match: d => d.data.value <= 50 },
  { id: 'lightGreen', match: d => d.data.value <= 75 },
  { id: 'darkGreen', match: d => d.data.value >= 76 },
]

// define colors
const defs = [
  { id: 'red', type: 'patternLines', background: red[500], color: red[500] },
  { id: 'orange', type: 'patternLines', background: orange[500], color: orange[500] },
  { id: 'yellow', type: 'patternLines', background: yellow[500], color: yellow[500] },
  { id: 'lightGreen', type: 'patternLines', background: green[500], color: green[500] },
  { id: 'darkGreen', type: 'patternLines', background: green[900], color: green[900] },
]

const UtilizationGraph = ({ data, keys, indexBy }) => {
  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      margin={{ top: 50, right: 240, bottom: 50, left: 240 }}
      labelSkipWidth={30}
      padding={0.2}
      groupMode="grouped"
      layout="horizontal"
      fill={fill}
      defs={defs}
      label={d => `${d.value}%`}
      tooltipFormat={v => `${v}%`}
      axisBottom={{ format: v => `${v}%` }}
      maxValue={100}
      enableGridX
    />
  )
}
export default UtilizationGraph

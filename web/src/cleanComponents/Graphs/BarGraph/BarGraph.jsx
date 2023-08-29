import React from 'react'
import { Column } from '@ant-design/plots'
import { generateColorForValue } from '../../../components/Graphs/Helpers/Formatters'

const BarGraph = ({ data, graphId, xField, showLabel, onReady }) => {
  const r = []
  data.map(t => {
    const keys = Object.keys(t).filter(k => k !== xField)
    keys.map(k => r.push({ month: t.month, value: t[k], type: k }))
    return t
  })
  const config = {
    data: r,
    color: datum => generateColorForValue(datum.type, graphId),
    label: showLabel ? { position: 'middle' } : false, // format for label on top of section
    isStack: true,
    xField,
    yField: 'value',
    seriesField: 'type',
    animation: false,
    legend: { position: 'bottom', maxRow: 3 },
    onReady,
  }

  return <Column {...config} />
}

export default BarGraph
